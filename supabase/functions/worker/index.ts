// Drains the outbox: customer emails (in their language), alert emails, test emails and Google Calendar.
// The database wakes it every minute when jobs are waiting (private.kick_worker), with a shared
// secret. Each job is claimed so two runs never send the same email; a failure is retried, and
// after 5 tries the Admin is told.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { syncCalendar } from '../_shared/calendar.ts'
import { brandValues, fill, sendEmail, wording } from '../_shared/email.ts'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** "Sunday 8 November" and "11:00", Riyadh time; Arabic stays on the Gregorian calendar. */
function when(iso: string, lang: string) {
  const locale = lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB'
  const d = new Date(iso)
  return {
    date: new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Riyadh', weekday: 'long', day: 'numeric', month: 'long' }).format(d),
    time: new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d),
  }
}

async function context() {
  const [{ data: settings }, { data: texts }] = await Promise.all([
    db.from('settings').select('company, emails_off, reminder_hours').single(),
    db.from('texts').select('key, en, ar'),
  ])
  return {
    company: settings?.company ?? {},
    emailsOff: (settings?.emails_off ?? []) as string[],
    reminderHours: (settings?.reminder_hours ?? [24]) as number[],
    texts: Object.fromEntries((texts ?? []).map((t: any) => [t.key, t])),
  }
}

async function member(id: number) {
  const { data, error } = await db.from('members').select('*').eq('id', id).single()
  if (error) throw new Error(`Member ${id}: ${error.message}`)
  return data
}

/** An activity line on a member in English and Arabic, from the texts table (log_* keys). */
async function logLine(ctx: any, memberId: number, key: string, values: Record<string, string>) {
  const say = (lang: string) => fill(ctx.texts[key]?.[lang] || ctx.texts[key]?.en || key, values)
  await db.from('activity').insert({ member_id: memberId, kind: 'email', text: say('en'), text_ar: say('ar') })
}

/** What every customer email can say besides its member's own details. */
function shared(ctx: any, lang: string) {
  return {
    ...brandValues(ctx.company, lang),
    // One left-to-right piece that doesn't break, or "+966 11 000 0000" scrambles inside Arabic.
    support_phone: `\u2066${(ctx.company.support_phone ?? '').replaceAll(' ', '\u00a0')}\u2069`,
  }
}

/**
 * One customer email from the texts table, in the member's language, replying to their Sales owner;
 * noted on the member's log. An email the Admin turned off is only noted.
 */
async function customerEmail(ctx: any, m: any, template: string, payload: any) {
  const name = template.replaceAll('_', ' ')
  if (ctx.emailsOff.includes(template)) return logLine(ctx, m.id, 'log_email_off', { email: name })
  const lang = m.language === 'ar' ? 'ar' : 'en'
  const t = wording(ctx.texts, template, lang)
  const at = payload.session_at ?? m.session_at
  const values = {
    ...shared(ctx, lang),
    name: m.first_name,
    meet_link: m.meet_link ?? '',
    after_link: `${ctx.company.app_url ?? ''}/after/${m.after_token}`,
    expires: m.link_expires_at ? `${when(m.link_expires_at, lang).date} ${when(m.link_expires_at, lang).time}` : '',
    hours: String(payload.hours ?? ''),
    ...(at ? when(at, lang) : { date: '', time: '' }),
  }
  const { data: owner } = await db.from('profiles').select('email').eq('id', m.sales_id).single()
  const subject = fill(t.subject, values)
  const sent = await sendEmail(m.email, ctx.company.sender_email ?? '', subject, fill(t.body, values), owner?.email)
  await logLine(ctx, m.id, sent ? 'log_email_sent' : 'log_email_not_sent', { subject })
}

/** An alert, by email, to someone who asked for alert emails, in their own language. */
async function alertEmail(ctx: any, alertId: number) {
  const { data: a } = await db.from('alerts').select('text, text_ar, member_id, person_id').eq('id', alertId).single()
  if (!a) return
  const { data: p } = await db.from('profiles').select('name, email, active, email_alerts, language').eq('id', a.person_id).single()
  if (!p?.active || !p.email_alerts) return
  const lang = p.language === 'ar' ? 'ar' : 'en'
  const code = a.member_id ? (await db.from('members').select('code').eq('id', a.member_id).single()).data?.code : null
  const t = wording(ctx.texts, 'alert', lang)
  const values = {
    ...brandValues(ctx.company, lang),
    name: p.name.split(' ')[0],
    text: lang === 'ar' && a.text_ar ? a.text_ar : a.text,
    link: `${ctx.company.app_url ?? ''}${code ? `/members/${code}` : '/alerts'}`,
  }
  await sendEmail(p.email, ctx.company.sender_email ?? '', fill(t.subject, values), fill(t.body, values))
}

/**
 * Settings → Emails & texts → Send a test to me: the email as saved now, in the language picked,
 * filled with a made-up member, to the Admin who asked. Every placeholder gets a sample.
 */
async function testEmail(ctx: any, p: any) {
  const lang = p.lang === 'ar' ? 'ar' : 'en'
  const t = wording(ctx.texts, p.template, lang)
  const app = ctx.company.app_url ?? ''
  const soon = new Date(Date.now() + 864e5)
  soon.setUTCHours(7, 0, 0, 0) // 10:00 Riyadh tomorrow
  const values = {
    ...shared(ctx, lang),
    name: p.name ?? '',
    email: p.to,
    password: 'Abcd-2345-Efgh',
    link: `${app}/login`,
    old_email: 'old.address@example.com',
    new_email: p.to,
    text: lang === 'ar' ? 'مثال على تنبيه' : 'An example alert',
    meet_link: 'https://meet.google.com/abc-defg-hij',
    after_link: `${app}/after/example`,
    expires: `${when(new Date(+soon + 2 * 864e5).toISOString(), lang).date} ${when(soon.toISOString(), lang).time}`,
    // The same sample member as the preview on the Texts page (admin.settings.texts.sample in src/content).
    hours: String(ctx.reminderHours[0] ?? 24),
    customer: lang === 'ar' ? 'عطور نجم' : 'Najm Perfumes',
    ...when(soon.toISOString(), lang),
  }
  await sendEmail(p.to, ctx.company.sender_email ?? '', `[Test] ${fill(t.subject, values)}`, fill(t.body, values))
}

/* The emails that carry the Meet link: they wait until Google has made it. */
const NEEDS_MEET = ['session_booked', 'session_moved']

async function handle(ctx: any, job: any) {
  const p = job.payload
  if (job.kind === 'calendar_sync') {
    const m = await member(p.member_id)
    const guests = [m.email]
    if (m.onboarding_id) {
      const { data } = await db.from('profiles').select('email').eq('id', m.onboarding_id).single()
      if (data) guests.push(data.email)
    }
    const title = fill(ctx.texts.calendar_title?.en || '{product} training · {customer}', { ...brandValues(ctx.company), customer: m.company })
    const offline = await syncCalendar(db, m, guests, title, ctx.company.name ?? '')
    if (p.email) {
      const now = await member(p.member_id)
      // With Google connected, a booking email never goes without its Meet link: the job is tried
      // again (1, 2, 4, 8 minutes) and after the last try the Admin is told.
      if (!offline && NEEDS_MEET.includes(p.email) && now.session_at && !now.meet_link) {
        throw new Error('The Meet link isn’t ready yet, so the booking email is waiting for it')
      }
      await customerEmail(ctx, now, p.email, p)
    }
    return
  }
  if (p.test) return testEmail(ctx, p)
  if (p.template === 'alert') return alertEmail(ctx, p.alert_id)
  return customerEmail(ctx, await member(p.member_id), p.template, p)
}

async function drain() {
  const { data: jobs, error } = await db.rpc('claim_jobs', { p_limit: 20 })
  if (error) return console.error(`claim_jobs: ${error.message}`)
  if (!jobs?.length) return
  const ctx = await context()
  for (const job of jobs) {
    try {
      await handle(ctx, job)
      await db.rpc('finish_job', { p_id: job.id, p_ok: true, p_error: null })
    } catch (err) {
      await db.rpc('finish_job', { p_id: job.id, p_ok: false, p_error: err instanceof Error ? err.message : String(err) })
    }
  }
}

const SECRET = Deno.env.get('WORKER_SECRET')

Deno.serve((req) => {
  // Only the database's wake-up call (private.kick_worker) carries the secret.
  if (!SECRET || req.headers.get('x-worker-secret') !== SECRET) return new Response('Not allowed', { status: 401 })
  // Answer at once and finish in the background, so the database's call never waits.
  const work = drain()
  // @ts-ignore EdgeRuntime is the Supabase runtime's global
  if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(work)
  return new Response(JSON.stringify({ started: true, at: new Date().toISOString(), method: req.method }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  })
})
