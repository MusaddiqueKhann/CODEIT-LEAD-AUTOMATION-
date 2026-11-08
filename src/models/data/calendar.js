import { fromDay, fromServer } from '../rules/format.js'
import { toTime } from '../rules/time.js'
import { supabase } from './client.js'
import { toError } from './errors.js'

/**
 * What goes on this person's calendar between two days ("YYYY-MM-DD"): sessions, the other steps'
 * due dates (`detail` is the document for a file due), and leave. The server decides what this
 * person may see; `all` adds every other session (Onboarding Sessions).
 */
export async function listCalendar(from, to, all = false) {
  const { data, error } = await supabase.rpc('calendar_items', { p_from: from, p_to: to, p_all: all })
  if (error) throw toError(error)
  return data.map((r, i) => {
    const at = r.starts_at && fromServer(r.starts_at)
    return {
      id: `${r.kind}:${r.member_id ?? r.person_id}:${r.day}:${i}`,
      kind: r.kind,
      memberId: r.member_id,
      code: r.code,
      title: r.title,
      sub: r.sub,
      date: fromDay(r.day),
      endsDate: fromDay(r.ends_day ?? r.day),
      time: at ? toTime(at.getHours() * 60 + at.getMinutes()) : null,
      minutes: at ? Math.round((Date.parse(r.ends_at) - Date.parse(r.starts_at)) / 6e4) : null,
      personId: r.person_id,
      status: r.status,
      meetLink: r.meet_link,
      held: r.kind === 'session' && !r.person_id,
      detail: r.detail,
    }
  })
}
