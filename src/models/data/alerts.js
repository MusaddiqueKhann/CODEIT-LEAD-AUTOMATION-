import { camelKeys } from './case.js'
import { fromServer } from '../rules/format.js'
import { supabase } from './client.js'
import { rows } from './rows.js'
import { toError } from './errors.js'

/** Your alerts, newest first, with the member's code to open. */
export async function listAlerts() {
  const list = await rows(
    supabase.from('alerts').select('id, kind, text, text_ar, read_at, created_at, member_id, members(code)').order('created_at', { ascending: false }).limit(200),
  )
  return list.map((a) => ({ ...camelKeys(a), code: a.members?.code ?? null, at: fromServer(a.created_at) }))
}

/** Marks some alerts read, or all of them (no ids). */
export async function markRead(ids = null) {
  const { error } = await supabase.rpc('mark_alerts_read', { p_ids: ids })
  if (error) throw toError(error)
}

/** The sidebar's numbers: { sessions_today, waiting, on_leave, unread }. */
export async function myCounts() {
  const { data, error } = await supabase.rpc('my_counts')
  if (error) throw toError(error)
  return data
}

/** Where an alert leads: its member's page, or the Alerts page when it isn't about one. */
export async function alertPath(alert) {
  if (!alert.member_id) return '/alerts'
  const { data } = await supabase.from('members').select('code').eq('id', alert.member_id).maybeSingle()
  return data ? `/members/${data.code}` : '/alerts'
}

let channels = 0

/**
 * Calls `cb` whenever one of this person's alerts is added or read. Returns the unsubscribe.
 * Each caller gets its own channel: Supabase refuses a second listener on an open channel.
 */
export function onAlertsChange(personId, cb) {
  const channel = supabase
    .channel(`alerts:${personId}:${++channels}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `person_id=eq.${personId}` }, cb)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
