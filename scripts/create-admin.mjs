// Makes an Admin on a Supabase project: the first one on a new project, or another later.
//
//   SUPABASE_URL=https://<project>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<service key> npm run create-admin
//
// It asks for a name and a work email and makes a temporary password. The password is shown
// here, once, and nowhere else (never logged or emailed). The Admin chooses their own at first
// sign-in. The service key can do anything, so pass it on the command line; don't save it in a file.
import { createInterface } from 'node:readline'
import { randomInt } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API keys).')
  process.exit(1)
}

/** "Ab3k-m!9Q-zZ7p": 12 characters in three groups, one of them a symbol (as the Team page makes them). */
function newPassword() {
  const pick = (set) => set[randomInt(set.length)]
  const s = Array.from({ length: 12 }, (_, i) => pick(i === 5 ? '!@#$%&' : 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789')).join('')
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`
}

// One answer per line, typed or piped in.
const input = createInterface({ input: process.stdin })
const lines = input[Symbol.asyncIterator]()
const ask = async (question) => {
  process.stdout.write(question)
  return ((await lines.next()).value ?? '').trim()
}
const name = await ask('Name: ')
const email = (await ask('Work email (their username): ')).toLowerCase()
const language = (await ask('Language, en or ar [en]: ')) === 'ar' ? 'ar' : 'en'
input.close()
if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('A name and a full email are needed.')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const password = newPassword()
// The database makes the team profile from the role in app_metadata (private.handle_new_user).
const { data, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name },
  app_metadata: { role: 'admin', must_change_password: true },
})
if (error) {
  console.error(error.code === 'email_exists' ? 'Someone already has this email.' : error.message)
  process.exit(1)
}
if (language === 'ar') await db.from('profiles').update({ language }).eq('id', data.user.id)

console.log(`\n${name} is an Admin. They sign in with:\n\n  Email:               ${email}\n  Temporary password:  ${password}\n`)
console.log('It is shown only now. They choose their own password at first sign-in.')
