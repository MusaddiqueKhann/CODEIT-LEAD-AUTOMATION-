// Sends one email through SendGrid, with the key the Admin added in Settings → Company (kept in
// Vault) or else the SENDGRID_API_KEY secret. With neither (local development) it sends nothing
// and says so; it never logs the email itself, which may hold a password.
import { createClient } from 'npm:@supabase/supabase-js@2'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** "{name}" → values.name, for the wording kept in the texts table. */
export const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '')

/** The names in Settings → Company every email can use: {app}, {product} and {company} (Arabic when there is one). */
export const brandValues = (company: Record<string, string> = {}, lang = 'en') => ({
  app: company.app_name ?? '',
  product: company.product_name ?? '',
  company: (lang === 'ar' && company.name_ar) || company.name || '',
})

/** An email's subject and body in one language, or a clear error when the Admin left either empty. */
export function wording(texts: Record<string, Record<string, string>>, template: string, lang: string) {
  const subject = texts[`${template}_subject`]?.[lang]
  const body = texts[`${template}_body`]?.[lang]
  if (!subject?.trim() || !body?.trim()) {
    throw new Error(`The “${template.replaceAll('_', ' ')}” email has no ${lang === 'ar' ? 'Arabic' : 'English'} wording (Settings → Emails & texts)`)
  }
  return { subject, body }
}

/**
 * Sends it; false when no email service is set up (local development). With the service set up,
 * an empty sender address is an error, so the job fails and the Admin is told.
 */
export async function sendEmail(to: string, from: string, subject: string, text: string, replyTo?: string): Promise<boolean> {
  const { data: saved } = await db.rpc('email_key')
  const key = saved || Deno.env.get('SENDGRID_API_KEY')
  if (!key) {
    console.log(`email not sent (no email service key): "${subject}" to ${to}`)
    return false
  }
  if (!from) throw new Error('Set the sender email in Settings → Company; no email can go out without it')
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      ...(replyTo ? { reply_to: { email: replyTo } } : {}),
      subject,
      content: [{ type: 'text/plain', value: text }],
    }),
  })
  if (!res.ok) throw new Error(`SendGrid refused the email (${res.status}): ${await res.text()}`)
  return true
}
