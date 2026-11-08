/** Shared by the calendar's views. */

/** Pixels per hour in the time grid; a 30-minute session is half of it, as in the design. */
export const HOUR = 160

export const range = (from, to) => Array.from({ length: to - from }, (_, i) => from + i)

/** "10:00 – 10:30" for a session item. */
export function timeSpan(item) {
  const [h, m] = item.time.split(':').map(Number)
  const end = h * 60 + m + item.minutes
  return `${item.time} – ${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`
}

/**
 * Sessions grouped by start time: one card when a time has one session, a stacked card when it
 * has several. ponytail: sessions that overlap but start at different times draw over each
 * other; lanes would fix it if that starts happening.
 */
export function byStart(items) {
  const groups = new Map()
  for (const i of items) groups.set(i.time, [...(groups.get(i.time) ?? []), i])
  return [...groups.values()]
}
