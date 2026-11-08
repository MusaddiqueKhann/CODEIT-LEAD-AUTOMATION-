import { isSameDay, riyadhNow, weekdayShort } from './format.js'
import { addDays, startOfWeek } from './time.js'

/* Small date helpers the role Overviews share. */
export const isToday = (m) => m.session && isSameDay(m.session.date, riyadhNow())
/** Within the Sunday-to-Saturday week around today. */
export const thisWeek = (m) => {
  if (!m.session) return false
  const start = startOfWeek(riyadhNow())
  return m.session.date >= start && m.session.date < addDays(start, 7)
}
export const open = (m) => !m.outcome && m.stage !== 'closed'
/** "Tue 10": a day and its date, in the app's language. */
export const dayDate = (d) => `${weekdayShort(d)} ${String(d.getDate()).padStart(2, '0')}`
