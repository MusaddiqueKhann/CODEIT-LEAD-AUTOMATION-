import { dayKey, riyadhNow, startOfDay } from './format.js'

/** "Faisal Al-Harbi" → "FH" */
export const initials = (name) =>
  name
    .split(' ')
    .map((w) => w.replace('Al-', '')[0])
    .join('')
    .slice(0, 2)

/** Times are 24-hour "HH:MM" strings in Riyadh time. */
export const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export const byDateTime = (a, b) => a.date - b.date || a.time.localeCompare(b.time)

export const addDays = (date, n) => {
  const d = startOfDay(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Start times on a day, `step` minutes apart, where a `length`-minute session still ends inside its hours. */
export function daySlots(hours, length, step) {
  if (!hours.on) return []
  const slots = []
  for (let m = toMinutes(hours.from); m + length <= toMinutes(hours.to); m += step) slots.push(toTime(m))
  return slots
}

/** Splits `{ time }` slots at noon into two groups; empty groups drop out. */
export const byPartOfDay = (slots) =>
  [
    ['Morning', slots.filter((s) => toMinutes(s.time) < 12 * 60)],
    ['Afternoon', slots.filter((s) => toMinutes(s.time) >= 12 * 60)],
  ].filter(([, list]) => list.length)

/** The next `count` days after today that have open hours, inside the window. */
export function openDays(hours, count, windowDays) {
  const days = []
  for (let i = 1; i <= windowDays && days.length < count; i++) {
    const d = addDays(riyadhNow(), i)
    if (hours[d.getDay()].on) days.push(d)
  }
  return days
}

/** First and last hour the calendar grid shows: 09–17, widened to cover any open hours. */
export function hourSpan(hours) {
  const open = hours.filter((h) => h.on)
  return [
    Math.min(9, ...open.map((h) => Math.floor(toMinutes(h.from) / 60))),
    Math.max(17, ...open.map((h) => Math.ceil(toMinutes(h.to) / 60))),
  ]
}

/** How long a working day is, in hours: the office days that are on, averaged (8 for 09:00–17:00). */
export function workdayHours(officeHours) {
  const on = officeHours.filter((d) => d.on)
  return on.length ? on.reduce((n, d) => n + (toMinutes(d.to) - toMinutes(d.from)) / 60, 0) / on.length : 0
}

/**
 * The `n`th working day after `d`, or before it when n is negative (`d` itself when n is 0); days
 * off in `officeHours` and the `holidays` ("YYYY-MM-DD" set) are skipped, like the server's rules.
 */
export function addWorkingDays(d, n, officeHours, holidays = new Set()) {
  const step = n < 0 ? -1 : 1
  let day = startOfDay(d)
  for (let left = Math.abs(n), guard = 0; left > 0 && guard < 1000; guard++) {
    day = addDays(day, step)
    if (officeHours[day.getDay()].on && !holidays.has(dayKey(day))) left--
  }
  return day
}

/**
 * Working days from `from` to `to`: counted after `from` up to and including `to`, negative when
 * `to` has passed. Days off in `officeHours` and the `holidays` ("YYYY-MM-DD" set) don't count.
 */
export function workingDaysUntil(from, to, officeHours, holidays = new Set()) {
  const step = to >= from ? 1 : -1
  let d = startOfDay(from)
  let n = 0
  for (let guard = 0; +d !== +startOfDay(to) && guard < 1000; guard++) {
    d = addDays(d, step)
    const day = step > 0 ? d : addDays(d, 1)
    if (officeHours[day.getDay()].on && !holidays.has(dayKey(day))) n += step
  }
  return n
}
