import { dayKey, fromServer, riyadhNow, startOfDay } from './format.js'
import { addDays, toMinutes } from './time.js'

/** The person's seven days of { on, from, to }, Sunday first: their own hours or the office's. */
export const hoursOf = (person, officeHours) => person.hours ?? officeHours

/** Hours as a number ("14:30" → 14.5), for placing bars on the 06:00–22:00 track. */
export const hourOf = (time) => toMinutes(time) / 60

/** The Sunday-to-Saturday week around today, as seven Dates. */
export function thisWeek() {
  const today = startOfDay(riyadhNow())
  const sunday = addDays(today, -today.getDay())
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i))
}

/** The leave row covering a day ("YYYY-MM-DD"), if any. */
export const leaveOn = (leave, day) => leave.find((l) => l.startsOn <= day && l.endsOn >= day)

/** Members this person is on that are still open. */
export const openWith = (members, id) =>
  members.filter((m) => !m.outcome && m.stage !== 'closed' && Object.values(m.people).includes(id))

/** Sessions this person runs on a day, as [start, end, member] in hours. */
export function sessionsOn(members, id, day) {
  return members
    .filter((m) => m.people.onboarding === id && !m.outcome && m.session && dayKey(m.session.date) === day)
    .map((m) => {
      const end = fromServer(m.sessionEndsAt)
      return [m.session.at.getHours() + m.session.at.getMinutes() / 60, end.getHours() + end.getMinutes() / 60, m]
    })
}
