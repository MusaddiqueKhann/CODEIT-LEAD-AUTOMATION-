import { dayKey, formatShort, riyadhNow } from './format.js'
import { translate } from '../../content/index.js'
import { addDays, toMinutes } from './time.js'

/* The words helpers here use unless the screen passes its own `t` (useLang's, in the reader's language). */
const english = (key, values) => translate('en', key, values)

/*
 * The documents and features maths. The lists themselves (business types, documents, features,
 * "send later" choices) come from the `options` table through useConfig(), so these functions
 * take them as arguments and stay pure. An option item is { key, label, active, meta }.
 */

const forPlan = (plan, item) => !item.meta.plans || item.meta.plans.includes(plan)

/**
 * The documents a member sends: the ones for its customer type (a document's `plans`; none listed
 * means every type, an empty list none) and the ones its picked integrations need. None until a
 * type is picked.
 */
export const docsFor = (documents, plan, integrations = []) =>
  plan ? documents.filter((d) => forPlan(plan, d) || d.meta.integrations?.some((k) => integrations.includes(k))).map((d) => d.key) : []

/** The documents one integration needs (its `integrations` name it, the CR for SurePay too), among the member's own (`keys`, from docsFor). */
export const integrationDocs = (documents, key, keys) => documents.filter((d) => d.meta.integrations?.includes(key) && keys.includes(d.key)).map((d) => d.key)

export const featuresFor = (features, plan) => (plan ? features.filter((f) => forPlan(plan, f)).map((f) => f.key) : [])

/**
 * "1 week" when it matches a "send later" choice, else "10 days". `nameOf(choice)` names a choice
 * (the screen passes the list's name in the reader's language).
 */
export function inDaysLabel(choices, days, t = english, nameOf = (c) => c.label) {
  const choice = choices.find((c) => c.meta.days === days)
  return choice ? nameOf(choice) : t('shared.documents.inDays', { n: days })
}

/** "Thu 05 Nov": the date `days` from today. */
export const dueOn = (days) => formatShort(addDays(riyadhNow(), days))

/** Each document's state: true once a file is in, else the days until it's due, else undefined. */
export const docState = (files, due, keys) => Object.fromEntries(keys.map((k) => [k, files[k] ? true : due[k]]))

/**
 * Tally of a state map (see docState) over its keys. `latest` is the longest
 * wait among the ones still due, or null when nothing is.
 */
export function readiness(state, keys) {
  const waits = keys.map((k) => state[k]).filter((v) => typeof v === 'number')
  const done = keys.filter((k) => state[k] === true).length
  return { done, pending: waits.length, unmarked: keys.length - done - waits.length, total: keys.length, latest: waits.length ? Math.max(...waits) : null }
}

/** Still to send first (due soonest first, then the ones with no date), uploaded last. */
export const byReadiness = (state) => (a, b) => rank(state[a]) - rank(state[b])
const rank = (v) => (v === true ? Infinity : typeof v === 'number' ? v : Number.MAX_SAFE_INTEGER)

/** What the file picker offers for a document's type (Settings → Required documents); none set: PDF or a picture. */
export const FILE_TYPES = { pdf: '.pdf', image: '.jpg,.jpeg,.png,.webp', excel: '.xlsx,.xls,.csv', any: '' }
export const acceptFor = (type) => FILE_TYPES[type] ?? '.pdf,.jpg,.jpeg,.png'

/** "PDF" from "cr_certificate.pdf". */
export const extOf = (name) => (name?.split('.').pop() ?? '').toUpperCase().slice(0, 4)

export const fileSize = (bytes) => (bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`)

/** A member's documents and their tally, from the full documents list. */
export function documentsOf(documents, m) {
  const keys = docsFor(documents, m.plan, m.integrations)
  const state = docState(m.files, m.due, keys)
  return { keys, state, tally: readiness(state, keys) }
}

/** The ready check's passes and parts, from the server's { check: true/false, ok }. */
export function readyOf(m) {
  const parts = Object.entries(m.ready ?? {}).filter(([k]) => k !== 'ok')
  return { done: parts.filter(([, v]) => v).length, total: parts.length }
}

/** Who has a member when nobody on the team does: the customer (recording), or nobody yet. */
export const nobodyLabel = (m, t = english) =>
  m.outcome || m.stage === 'closed' ? '—' : m.stage === 'recording' ? t('shared.nobody.customer') : t('shared.nobody.picked')

/**
 * What counts against someone's places, the server's rule (private.open_count): Account until the
 * account is made, Integration while integrating, Onboarding from setup to the recording. Null for
 * roles that aren't picked automatically.
 */
export function loadOf(members, person) {
  const id = person.id
  const counts = {
    account: (m) => m.people.account === id && !m.accountCreatedAt,
    integration: (m) => m.people.integration === id && m.stage === 'integration',
    onboarding: (m) => m.people.onboarding === id && ['setup', 'session', 'recording'].includes(m.stage),
  }[person.role]
  return counts ? members.filter((m) => !m.outcome && counts(m)).length : null
}

/**
 * The Onboarding Members free to take a new session starting at `at` (a Riyadh-time Date), by the
 * server's own rule (private.busy_reason): active and signed in, not on leave, a working day and
 * inside their hours, not full, and no session of theirs within the gap. `people` are
 * { id, role, active, mustChangePassword, hours }; `leave` { personId, startsOn, endsOn };
 * `holidays` { day }.
 */
export function freeAt(at, { people, members, leave, holidays, settings }) {
  const day = dayKey(at)
  const dow = at.getDay()
  if (!settings.officeHours[dow].on || holidays.some((h) => h.day === day)) return []
  const start = at.getHours() * 60 + at.getMinutes()
  const end = start + settings.sessionMinutes
  const gap = settings.gapMinutes
  return people.filter((p) => {
    if (p.role !== 'onboarding' || !p.active || p.mustChangePassword) return false
    if (leave.some((l) => l.personId === p.id && l.startsOn <= day && l.endsOn >= day)) return false
    const h = (p.hours ?? settings.officeHours)[dow]
    if (!h.on || start < toMinutes(h.from) || end > toMinutes(h.to)) return false
    if (loadOf(members, p) >= settings.maxOpenMembers) return false
    return !members.some((m) => {
      if (m.people.onboarding !== p.id || m.outcome || !m.session || ['recording', 'closed'].includes(m.stage) || dayKey(m.session.date) !== day) return false
      const s = toMinutes(m.session.time)
      const length = m.sessionEndsAt ? (Date.parse(m.sessionEndsAt) - Date.parse(m.sessionAt)) / 6e4 : settings.sessionMinutes
      return start - gap < s + length && end + gap > s
    })
  })
}
