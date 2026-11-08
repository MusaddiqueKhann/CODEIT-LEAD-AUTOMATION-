// Keeps one Google Calendar event per booked session, with a Meet link, on the shared training
// calendar. It reads the member as it is now, so the order jobs run in doesn't matter.
// Needs GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_CALENDAR_ID and GOOGLE_IMPERSONATE (a Workspace user
// the service account acts as, through domain-wide delegation with the calendar.events scope).
import { SignJWT, importPKCS8 } from 'npm:jose@5'

const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
let cached: { token: string; until: number } | null = null

async function googleToken(json: string, impersonate: string) {
  if (cached && cached.until > Date.now()) return cached.token
  const sa = JSON.parse(json)
  const key = await importPKCS8(sa.private_key, 'RS256')
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(sa.client_email)
    .setSubject(impersonate)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  if (!res.ok) throw new Error(`Google refused the sign-in (${res.status}): ${await res.text()}`)
  const { access_token } = await res.json()
  cached = { token: access_token, until: Date.now() + 55 * 60 * 1000 }
  return access_token
}

/** Our own event id per booking, so a retry finds the event instead of making a second one. */
async function eventId(memberId: number, bookingNo: number) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`lead-codeit:${memberId}:${bookingNo}`))
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32) // 0-9a-f fits Google's base32hex
}

const letters = (n: number) => Array.from({ length: n }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('')

/**
 * Creates, moves or deletes the event to match the member, and writes the Meet link back. `title`
 * is the event's name (Settings → Emails & texts). Returns a note when Google isn't connected
 * (local development), null when it is.
 */
export async function syncCalendar(db: any, m: any, guestEmails: string[], title: string, company: string) {
  const json = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
  const calendar = Deno.env.get('GOOGLE_CALENDAR_ID')
  const impersonate = Deno.env.get('GOOGLE_IMPERSONATE')
  const wanted = m.session_at && !m.outcome

  if (!json || !calendar || !impersonate) {
    // ponytail: a made-up Meet link so the flow can be tried before Google is connected.
    if (wanted && !m.meet_link) await db.rpc('set_meet_link', { p_member: m.id, p_event: null, p_link: `https://meet.google.com/${letters(3)}-${letters(4)}-${letters(3)}` })
    return 'Google Calendar isn’t connected yet'
  }

  const token = await googleToken(json, impersonate)
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar)}/events`

  if (!wanted) {
    if (!m.calendar_event_id) return null
    const res = await fetch(`${base}/${m.calendar_event_id}?sendUpdates=none`, { method: 'DELETE', headers })
    if (![200, 204, 404, 410].includes(res.status)) throw new Error(`Google refused to delete the event (${res.status})`)
    await db.rpc('set_meet_link', { p_member: m.id, p_event: null, p_link: null })
    return null
  }

  const id = await eventId(m.id, m.booking_no)
  const event = {
    summary: title,
    description: `${m.first_name} ${m.last_name} · ${m.code}\n${company}`,
    start: { dateTime: m.session_at, timeZone: 'Asia/Riyadh' },
    end: { dateTime: m.session_ends_at, timeZone: 'Asia/Riyadh' },
    attendees: guestEmails.map((email) => ({ email })),
  }
  // Our own emails tell the customer (in their language), so Google sends nothing (sendUpdates=none).
  let res = await fetch(`${base}?conferenceDataVersion=1&sendUpdates=none`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...event, id, conferenceData: { createRequest: { requestId: id, conferenceSolutionKey: { type: 'hangoutsMeet' } } } }),
  })
  if (res.status === 409) {
    res = await fetch(`${base}/${id}?conferenceDataVersion=1&sendUpdates=none`, { method: 'PATCH', headers, body: JSON.stringify(event) })
  }
  if (!res.ok) throw new Error(`Google refused the event (${res.status}): ${await res.text()}`)
  let saved = await res.json()
  // Meet can take a moment to be ready.
  for (let i = 0; i < 3 && !saved.hangoutLink; i++) {
    await new Promise((r) => setTimeout(r, 1500))
    saved = await (await fetch(`${base}/${id}`, { headers })).json()
  }
  await db.rpc('set_meet_link', { p_member: m.id, p_event: id, p_link: saved.hangoutLink ?? null })
  return null
}
