import { TODAY } from '../../data/mockData.js'
import { formatRelativeDay, monthShort, weekdayShort } from '../../lib/format.js'
import { sessionDateTime } from '../../lib/schedule.js'

/** "20 Jul" — the timeline's date stamp, where the year is never in doubt. */
export function dayMonth(date) {
  return `${date.getDate()} ${monthShort(date)}`
}

/** "Today" / "Tomorrow" / "Wed 22" — the upcoming gutter's day label. */
export function upcomingDay(date) {
  const relative = formatRelativeDay(date, TODAY)
  return relative === 'Today' || relative === 'Tomorrow'
    ? relative
    : `${weekdayShort(date)} ${date.getDate()}`
}

/** Join unlocks 10 minutes before the start, measured against the fixtures'
    TODAY like every other time on this page. */
export function joinOpen(booking) {
  return sessionDateTime(booking.date, booking.time) - TODAY <= 10 * 60000
}
