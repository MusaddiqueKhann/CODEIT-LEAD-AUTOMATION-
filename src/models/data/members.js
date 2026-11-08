import { camelKeys } from './case.js'
import { dayKey, fromDay, fromServer, riyadhNow, startOfDay, toServer } from '../rules/format.js'
import { addDays, toTime } from '../rules/time.js'
import { updateMember } from './actions.js'
import { supabase } from './client.js'
import { uploadDocument } from './files.js'
import { rows } from './rows.js'
import { toError } from './errors.js'

const DOCUMENT_COLUMNS = 'member_id, kind, name, size, path, uploaded_by, uploaded_at'

/** Every member this person may see (the server decides which), newest first. */
export async function listMembers() {
  const [members, documents] = await Promise.all([
    rows(supabase.from('member_list').select('*').order('created_at', { ascending: false })),
    rows(supabase.from('documents').select(DOCUMENT_COLUMNS)),
  ])
  return members.map((m) => toMember(m, documents.filter((d) => d.member_id === m.id)))
}

/** One member by its code (MBR-000101), or null when it doesn't exist or isn't theirs. */
export async function getMember(code) {
  const [member] = await rows(supabase.from('member_list').select('*').eq('code', code))
  if (!member) return null
  const documents = await rows(supabase.from('documents').select(DOCUMENT_COLUMNS).eq('member_id', member.id))
  return toMember(member, documents)
}

/** A session timestamp as the { at, date, time } the calendar and cards work in, Riyadh time. */
function slotOf(iso) {
  const at = fromServer(iso)
  return { at, date: startOfDay(at), time: toTime(at.getHours() * 60 + at.getMinutes()) }
}

/** A database row in the app's shape. */
function toMember(row, documents) {
  const m = camelKeys(row)
  const today = startOfDay(riyadhNow())
  return {
    ...m,
    people: { sales: m.salesId, account: m.accountPersonId, integration: m.integrationId, onboarding: m.onboardingId },
    files: Object.fromEntries(documents.map((d) => [d.kind, { name: d.name, size: d.size, path: d.path, by: d.uploaded_by, at: fromServer(d.uploaded_at) }])),
    // Days from today: the documents panel works in "due in N days".
    due: Object.fromEntries(Object.entries(m.docDue).map(([k, day]) => [k, Math.round((fromDay(day) - today) / 864e5)])),
    session: m.sessionAt ? slotOf(m.sessionAt) : null,
    createdAt: fromServer(m.createdAt),
  }
}

/** Activity lines for one member, newest first. */
export async function listActivity(memberId) {
  const lines = await rows(
    supabase.from('activity').select('id, actor_id, kind, text, text_ar, at').eq('member_id', memberId).order('id', { ascending: false }),
  )
  return lines.map((l) => ({ ...camelKeys(l), at: fromServer(l.at) }))
}

/** What happened since `since` (an ISO time) on every member this person can see, newest first. */
export async function listRecentActivity(since) {
  const lines = await rows(
    supabase.from('activity').select('id, member_id, actor_id, kind, text, text_ar, at').gte('at', since).order('at', { ascending: false }).limit(300),
  )
  return lines.map((l) => ({ ...camelKeys(l), at: fromServer(l.at) }))
}

/* The fields the member form edits, as the app names them; the server takes them snake_cased. */
const FORM_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'language', 'company', 'cr', 'vat', 'city', 'website',
  'industry', 'size', 'plan', 'branches', 'users', 'features', 'integrations', 'hardware']
const snake = (k) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
/** An empty field is "nothing"; counts are numbers. */
const tidy = (k, v) => (v === '' || v == null ? null : k === 'branches' || k === 'users' ? Number(v) : v)
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/** A member as the form's draft (the same keys Add a member uses). */
export const toDraft = (m) => ({
  ...Object.fromEntries(FORM_FIELDS.map((k) => [k, m[k] ?? ''])),
  files: m.files,
  due: m.due,
})

/** "Due in N days" → the dates the server keeps. */
/* A file already attached beats its promised date, so only the ones still to come are sent. */
const dueDates = (due, files) =>
  Object.fromEntries(Object.entries(due).filter(([k, d]) => d != null && !files[k]).map(([k, d]) => [k, dayKey(addDays(riyadhNow(), d))]))

/**
 * Saves what changed on the edit form: the fields in one update, then any new files, each
 * uploaded and recorded. Throws the server's sentence when something is refused.
 */
export async function saveMember(member, draft) {
  const patch = {}
  for (const k of FORM_FIELDS) if (!same(tidy(k, draft[k]), tidy(k, member[k]))) patch[snake(k)] = tidy(k, draft[k])
  const due = dueDates(draft.due, draft.files)
  if (!same(due, member.docDue)) patch.doc_due = due
  if (Object.keys(patch).length) await updateMember(member.id, patch)
  for (const [kind, f] of Object.entries(draft.files)) {
    if (f?.file) await uploadDocument(member.id, kind, f.file, member.files[kind]?.path)
  }
}

/**
 * Saves a new member: one server call creates it (the Sales owner is the person saving, or the
 * Admin's pick) and picks an Account Member; then each chosen file uploads. A file that fails to
 * upload doesn't undo the member: it comes back in `uploadErrors`.
 * Returns { id, code, account, phoneMatch, uploadErrors }.
 */
export async function addMember(draft, salesId) {
  const p = Object.fromEntries(FORM_FIELDS.map((k) => [snake(k), tidy(k, draft[k])]))
  p.doc_due = dueDates(draft.due, draft.files)
  if (salesId) p.sales_id = salesId
  if (draft.slot) p.session_at = toServer(draft.slot.date, draft.slot.time)

  const { data, error } = await supabase.rpc('add_member', { p })
  if (error) throw toError(error)

  const uploadErrors = []
  for (const [kind, f] of Object.entries(draft.files)) {
    if (!f?.file) continue
    try {
      await uploadDocument(data.id, kind, f.file)
    } catch (err) {
      uploadErrors.push(err.message)
    }
  }
  return { id: data.id, code: data.code, account: data.account, phoneMatch: data.phone_match, uploadErrors }
}
