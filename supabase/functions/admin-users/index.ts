// The Admin's people tools: add a person, reset a password, change an email, turn someone off or on.
// They need the service key (it can create sign-ins), so they run here, never in the browser.
// The caller must be an active Admin who has already set their own password.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { brandValues, fill, sendEmail, wording } from '../_shared/email.ts'

const ROLES = ['admin', 'sales', 'account', 'integration', 'onboarding']
const MIN_PASSWORD = 8   // the same as minimum_password_length in config.toml (Supabase → Auth → Passwords)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

/**
 * Only the app's own address (Settings → Company → App address) may call this from a browser;
 * while that is a local address, any page on this computer may. Until it is set, any page may, so
 * the first Admin isn't stuck (every call still needs an Admin's sign-in).
 */
function corsFor(origin: string, appUrl: string) {
  const own = URL.canParse(appUrl) ? new URL(appUrl).origin : ''
  const allowed = !own || origin === own || (LOCAL.test(own) && LOCAL.test(origin))
  return {
    'Access-Control-Allow-Origin': allowed ? origin : own,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** A refusal the screen can say in Arabic too: `code` names its translation. */
const refuse = (code: string, message: string) => Object.assign(new Error(message), { code })

/** "Ab3k-m!9Q-zZ7p": 12 characters in three groups, one of them a symbol. */
function newPassword() {
  const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length]
  const s = Array.from({ length: 12 }, (_, i) => pick(i === 5 ? '!@#$%&' : 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789')).join('')
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`
}

/**
 * Sends a team email in the person's language (`lang`), using the wording in the texts table and
 * the sender in Settings → Company.
 * False when it couldn't go (no email service, no sender, no wording): the Admin then reads the
 * password on screen, and the person is still made.
 */
async function sendTemplate(key: string, to: string, values: Record<string, string>, lang = 'en') {
  const [{ data: texts }, { data: settings }] = await Promise.all([
    db.from('texts').select('key, en, ar').in('key', [`${key}_subject`, `${key}_body`]),
    db.from('settings').select('company').single(),
  ])
  try {
    const t = wording(Object.fromEntries((texts ?? []).map((r) => [r.key, r])), key, lang === 'ar' ? 'ar' : 'en')
    const all = { ...brandValues(settings?.company, lang), ...values }
    return await sendEmail(to, settings?.company?.sender_email ?? '', fill(t.subject, all), fill(t.body, all))
  } catch (err) {
    console.log(`team email "${key}" not sent: ${err instanceof Error ? err.message : err}`)
    return false
  }
}

async function create(b: Record<string, any>, link: string) {
  const name = String(b.name ?? '').trim()
  const email = String(b.email ?? '').trim().toLowerCase()
  if (!name || !email || !ROLES.includes(b.role)) throw refuse('person_fields', 'A name, an email and a role are needed.')
  const password = String(b.password ?? '').trim() || newPassword()
  if (password.length < MIN_PASSWORD) throw refuse('password_short', `A password needs ${MIN_PASSWORD} or more characters.`)
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
    app_metadata: { role: b.role, must_change_password: true },
  })
  if (error) throw error.code === 'email_exists' ? refuse('email_taken', 'Someone on the team already has this email.') : new Error(error.message)
  const extra = { ...(b.hours ? { hours: b.hours } : {}), ...(b.language === 'ar' ? { language: 'ar' } : {}) }
  if (Object.keys(extra).length) await db.from('profiles').update(extra).eq('id', data.user.id)
  const emailed = await sendTemplate('team_welcome', email, { name, email, password, link }, b.language)
  return { id: data.user.id, password, emailed }
}

async function reset(b: Record<string, any>, link: string) {
  const { data: p } = await db.from('profiles').select('name, email, language, active').eq('id', b.id).single()
  if (!p?.active) throw refuse('person_off', 'Turn this person back on first.')
  const password = newPassword()
  const { error } = await db.auth.admin.updateUserById(b.id, { password })
  if (error) throw new Error(error.message)
  // Changing a password clears the first-password flag (a database trigger); a reset puts it back.
  await db.from('profiles').update({ must_change_password: true }).eq('id', b.id)
  const emailed = await sendTemplate('team_reset', p!.email, { name: p!.name, email: p!.email, password, link }, p!.language)
  return { password, emailed }
}

/** A new sign-in email, confirmed at once; the profile follows (a database trigger). Both addresses are told. */
async function changeEmail(b: Record<string, any>, link: string) {
  const email = String(b.email ?? '').trim().toLowerCase()
  if (!EMAIL.test(email)) throw refuse('email_invalid', 'Type a full email, like name@company.com.')
  const { data: p } = await db.from('profiles').select('name, email, language').eq('id', b.id).single()
  if (!p) throw refuse('person_missing', 'This person isn’t on the team.')
  if (email === p.email) return { email, emailed: false }
  // Supabase answers a taken email here with only "Error updating user", so ask first.
  const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('email', email)
  if (count) throw refuse('email_taken', 'Someone on the team already has this email.')
  const { error } = await db.auth.admin.updateUserById(b.id, { email, email_confirm: true })
  if (error) throw new Error(error.message)
  const values = { name: p.name, old_email: p.email, new_email: email, link }
  const sent = await Promise.all([p.email, email].map((to) => sendTemplate('team_email_changed', to, values, p.language)))
  return { email, emailed: sent.every(Boolean) }
}

async function setActive(id: string, on: boolean, me: string) {
  if (!on) {
    if (id === me) throw refuse('self_off', 'You can’t turn yourself off.')
    const { error } = await db.rpc('can_deactivate', { p_person: id })
    if (error) throw new Error(error.message)
  }
  // A ban stops new sign-ins; `active = false` makes the database refuse them at once.
  const { error } = await db.auth.admin.updateUserById(id, { ban_duration: on ? 'none' : '876000h' })
  if (error) throw new Error(error.message)
  await db.from('profiles').update({ active: on }).eq('id', id)
  return { active: on }
}

Deno.serve(async (req) => {
  const { data: s } = await db.from('settings').select('company').single()
  const origin = req.headers.get('origin') ?? ''
  const cors = corsFor(origin, s?.company?.app_url ?? '')
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '')
    const { data: auth } = await db.auth.getUser(token)
    if (!auth.user) return reply({ error: 'Sign in again.', code: 'sign_in_again' }, 401)
    const { data: me } = await db.from('profiles').select('role, active, must_change_password').eq('id', auth.user.id).single()
    if (!me || me.role !== 'admin' || !me.active || me.must_change_password) return reply({ error: 'Only the Admin manages people.', code: 'not_allowed' }, 403)

    const b = await req.json()
    // The app's address from Settings → Company; until it is set (local), the page that called.
    const link = `${s?.company?.app_url || origin}/login`
    if (b.action === 'create') return reply(await create(b, link))
    if (b.action === 'reset') return reply(await reset(b, link))
    if (b.action === 'change_email') return reply(await changeEmail(b, link))
    if (b.action === 'deactivate') return reply(await setActive(b.id, false, auth.user.id))
    if (b.action === 'reactivate') return reply(await setActive(b.id, true, auth.user.id))
    return reply({ error: 'Unknown action.' }, 400)
  } catch (err) {
    return reply({ error: err instanceof Error ? err.message : String(err), code: (err as any)?.code ?? null }, 400)
  }
})
