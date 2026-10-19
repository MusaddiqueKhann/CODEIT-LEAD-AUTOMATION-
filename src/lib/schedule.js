import { isSameDay, startOfDay } from './format.js'

/**
 * Scheduling rules, kept out of both the UI and the context.
 *
 * BookSession needs to know which slots are already taken so it can disable
 * them; BookingContext needs the same answer to reject a submit. Those were two
 * copies of the same predicate — one of them would eventually have drifted, and
 * the UI would have offered a slot the action then refused.
 */

/** CODE runs the same grid every working day. */
export const SESSION_TIMES = [
  '10:00 AM',
  '12:00 PM',
  '2:00 PM',
  '4:00 PM',
  '6:00 PM',
  '8:00 PM',
]

/**
 * Slot times are stored as display strings, so anything that needs to reason
 * about them — an end time, a part of day — has to parse them back first.
 * Kept here beside SESSION_TIMES rather than in format.js: these two functions
 * only make sense against that exact "h:mm AM" shape.
 */
export function timeToMinutes(time) {
  const [clock, meridiem] = time.split(' ')
  const [hours, minutes] = clock.split(':').map(Number)
  return ((hours % 12) + (meridiem === 'PM' ? 12 : 0)) * 60 + minutes
}

function toClock(total) {
  const hours24 = Math.floor(total / 60) % 24
  const minutes = total % 60
  const hours = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours}:${String(minutes).padStart(2, '0')} ${hours24 >= 12 ? 'PM' : 'AM'}`
}

/** `slotEnd('10:00 AM', 90)` → `'11:30 AM'` */
export function slotEnd(time, minutes) {
  return toClock(timeToMinutes(time) + minutes)
}

/** "Morning" / "Afternoon" / "Evening" — the coarse label people actually plan by. */
export function partOfDay(time) {
  const minutes = timeToMinutes(time)
  if (minutes < 12 * 60) return 'Morning'
  if (minutes < 17 * 60) return 'Afternoon'
  return 'Evening'
}

/**
 * A booking's Date carries no time and its slot is a display string; this pins
 * the two together into one Date, for countdowns and calendar exports.
 *
 * Built in the local frame — the same frame TODAY lives in — so a duration
 * measured as `sessionDateTime(...) - TODAY` is the real gap. Absolute-instant
 * work (an .ics stamp in UTC) is the calendar module's job, not this one's.
 */
export function sessionDateTime(date, time) {
  const minutes = timeToMinutes(time)
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
  )
}

/** Friday and Saturday — the working week here runs Sunday to Thursday. */
const WEEKEND = new Set([5, 6])

export function isWeekend(date) {
  return WEEKEND.has(date.getDay())
}

/**
 * The next `count` bookable dates starting at `from`, weekends excluded.
 *
 * Walks forward by day rather than generating a fixed window and filtering, so
 * the caller always gets exactly `count` options no matter how the weekends
 * fall.
 */
export function bookableDays(from, count = 12) {
  const days = []
  const cursor = startOfDay(from)

  while (days.length < count) {
    if (!isWeekend(cursor)) days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

/**
 * Is this date+time already spoken for by an upcoming booking?
 *
 * `exceptId` excludes the booking being moved — otherwise a reschedule would
 * always clash with itself and no slot could ever be picked.
 */
export function hasClash(bookings, { date, time, exceptId = null }) {
  return bookings.some(
    (b) => b.upcoming && b.id !== exceptId && b.time === time && isSameDay(b.date, date),
  )
}
