/* The same temporary password the server makes (supabase/functions/admin-users): 12 characters in
   three groups, no look-alikes (0/O, 1/l/I), and one symbol, e.g. "Hk7m-q$Tz-4wPa". */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const SYMBOLS = '!@#$%&'
/** The shortest password the sign-in allows (minimum_password_length in supabase/config.toml). */
export const MIN_PASSWORD = 8

/** A new temporary password, made in the browser so the Admin sees it before adding the person. */
export function newPassword() {
  const pick = (set) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length]
  const s = Array.from({ length: 12 }, (_, i) => pick(i === 5 ? SYMBOLS : LETTERS)).join('')
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`
}
