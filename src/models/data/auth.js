import { camelKeys } from './case.js'
import { formatTime, fromServer } from '../rules/format.js'
import { supabase } from './client.js'
import { rows } from './rows.js'
import { appError, toError } from './errors.js'

/**
 * Calls `cb(event, session)` on every sign-in change, starting with INITIAL_SESSION.
 * Returns the unsubscribe. Keep `cb` synchronous: awaiting another Supabase call inside it
 * deadlocks the client.
 */
export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange(cb)
  return () => data.subscription.unsubscribe()
}

/* Supabase error codes as sentences a person can act on: [our code, the English]. */
const SIGN_IN = {
  invalid_credentials: ['bad_login', 'Email or password is wrong.'],
  user_banned: ['account_off', 'Your account is turned off. Ask your Admin.'],
}
const PASSWORD = {
  same_password: ['same_password', 'That is your current password. Choose a new one.'],
}
const known = (table, error) => (table[error.code] ? appError(...table[error.code]) : toError(error))

/** Too many wrong passwords: the database says until when (Settings → Timing → Sign-in). */
const locked = (until) => {
  const time = formatTime(fromServer(until))
  return appError('locked', `Too many wrong passwords. Try again at ${time}.`, { time })
}

/** Asks first whether the email is locked out, reports a wrong password, and forgets the tries after a good one. */
export async function signIn(email, password) {
  const { data: until } = await supabase.rpc('sign_in_locked', { p_email: email })
  if (until) throw locked(until)
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error?.code === 'invalid_credentials') {
    const { data: now } = await supabase.rpc('sign_in_failed', { p_email: email })
    if (now) throw locked(now)
  }
  if (error) throw known(SIGN_IN, error)
  await supabase.rpc('sign_in_ok')
}

/**
 * "Sign in with Google": off to Google, then back to the sign-in page, which moves a signed-in
 * person on. Only people the Admin added get in (sign-ups are off; Supabase links the Google
 * account to theirs by its email).
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/login`, queryParams: { prompt: 'select_account' } },
  })
  if (error) throw toError(error)
}

/* Why Google sign-in came back refused (in the address Supabase returns to): [our code, the English]. */
const GOOGLE = {
  signup_disabled: ['not_on_team', 'This Google account isn’t on the team. Ask your Admin to add you with this email.'],
  user_banned: ['account_off', 'Your account is turned off. Ask your Admin.'],
}

/** A refused Google sign-in, read once from the address (then cleared from it), or null. */
export function takeGoogleError() {
  const params = new URLSearchParams(`${window.location.search.slice(1)}&${window.location.hash.slice(1)}`)
  const code = params.get('error_code') ?? (params.get('error') && 'unknown')
  if (!code) return null
  window.history.replaceState(null, '', window.location.pathname)
  return GOOGLE[code] ? appError(...GOOGLE[code]) : appError('google_failed', params.get('error_description') || 'Google sign-in didn’t work. Try again.')
}

/** `local` only forgets the sign-in in this browser, for when the server has already ended it. */
export const signOut = (scope = 'global') => supabase.auth.signOut({ scope })

export async function getProfile(id) {
  const [row] = await rows(supabase.from('profiles').select('*').eq('id', id))
  return row ? { ...camelKeys(row), avatarUrl: avatarUrl(row.avatar_path) } : null
}

/** A profile photo's address (the avatars bucket is public), or null when there is none. */
export const avatarUrl = (path) => (path ? supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl : null)

/** Uploads a new profile photo to the person's own folder; returns its path. */
export async function uploadAvatar(userId, file) {
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type || undefined })
  if (error) throw appError('photo_upload', `Couldn’t upload the photo: ${error.message}`)
  return path
}

/** Your own language ("en" or "ar") for the app, your alerts and team emails. */
export async function setMyLanguage(language) {
  const { error } = await supabase.rpc('set_my_language', { p_language: language })
  if (error) throw toError(error)
}

/** Your own name, phone, photo, and whether alerts also come by email. */
export async function updateMyProfile({ name, phone, emailAlerts, avatarPath }) {
  const { error } = await supabase.rpc('update_my_profile', {
    p_name: name, p_phone: phone, p_email_alerts: emailAlerts, p_avatar_path: avatarPath ?? null,
  })
  if (error) throw toError(error)
}

/** Checks the current password, then sets the new one. */
export async function changePassword(email, current, next) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: current })
  if (error) throw appError('wrong_current_password', 'Your current password is wrong.')
  await updatePassword(next)
}

/** Emails a reset link. Supabase answers the same whether or not the email is on the team. */
export async function requestReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/set-password`,
  })
  if (error) throw error
}

/** Opens the session a reset link carries. Called on a click, so mail scanners can't use it up. */
export async function verifyRecovery(tokenHash) {
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
  if (error) throw appError('link_expired', 'This link has expired or was already used. Ask for a new one.')
}

/** Sets the signed-in person's password. The server then clears their first-password flag. */
export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw known(PASSWORD, error)
}
