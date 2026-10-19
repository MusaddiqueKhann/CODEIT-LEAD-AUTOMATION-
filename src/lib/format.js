const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "Mon 20 Jul" */
export function formatShort(date) {
  return `${WEEKDAYS_SHORT[date.getDay()]} ${String(date.getDate()).padStart(2, '0')} ${MONTHS_SHORT[date.getMonth()]}`
}

/** "15 Jul 2026" — a past session, where the year matters and the weekday doesn't. */
export function formatMedium(date) {
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

/** "Monday, 20 July 2026" — the dateline under a page title. */
export function formatLong(date) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * "Today" / "Tomorrow", falling back to formatShort. `from` is passed in rather
 * than read off the clock so it stays pinned to the fixtures' TODAY.
 */
export function formatRelativeDay(date, from) {
  const days = Math.round((startOfDay(date) - startOfDay(from)) / 864e5)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return formatShort(date)
}

/**
 * "in 20 min" / "in about 3 hours" / "in 2 days" — the gap to an upcoming
 * session, rounded to the unit a person actually plans by.
 *
 * `from` is passed rather than read off the clock, for the same reason
 * formatRelativeDay takes it: everything on Overview is measured against the
 * fixtures' pinned TODAY, and a real-clock reading would put the mock sessions
 * years out.
 */
export function formatCountdown(target, from) {
  const ms = target - from
  if (ms <= 0) return 'starting now'

  const minutes = Math.round(ms / 6e4)
  if (minutes < 60) return `in ${minutes} min`

  const hours = Math.round(ms / 36e5)
  if (hours < 24) return `in about ${hours} hour${hours === 1 ? '' : 's'}`

  const days = Math.round(ms / 864e5)
  return `in ${days} day${days === 1 ? '' : 's'}`
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * "SAR 1,200" — grouped, and never with decimals.
 *
 * Session prices are whole riyals by definition (SESSION_PRICE is an integer
 * and bundles subtract integers), so trailing ".00" on every figure would be
 * noise pretending to be precision.
 */
export function formatMoney(amount) {
  return `SAR ${amount.toLocaleString('en-US')}`
}

/** "Week of 19 – 25 July" — the Sunday-to-Saturday week a date falls in. */
export function weekOf(date) {
  const start = startOfDay(date)
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return start.getMonth() === end.getMonth()
    ? `Week of ${start.getDate()} – ${end.getDate()} ${MONTHS[start.getMonth()]}`
    : `Week of ${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`
}

/** "Mon" — the day-picker chips stack the weekday over the date number. */
export function weekdayShort(date) {
  return WEEKDAYS_SHORT[date.getDay()]
}

/** "Jul" */
export function monthShort(date) {
  return MONTHS_SHORT[date.getMonth()]
}

/** "July 2026" — the calendar's month heading, where the year has to be visible. */
export function monthYear(date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** The calendar's column headers, Sunday-first to match `Date#getDay`. */
export const WEEKDAY_LABELS = WEEKDAYS_SHORT

/**
 * Same calendar day, ignoring time.
 *
 * Compared through startOfDay rather than by toDateString() or by pulling the
 * three fields apart at each call site — a booking's Date carries no time
 * component today, but nothing enforces that, and `a - b === 0` on raw Dates
 * would start returning false the moment one does.
 */
export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}
