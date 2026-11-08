import { bookableDays, openTimes } from '../../models/data/actions.js'
import { fromDay } from '../../models/rules/format.js'
import { useRows } from './useRows.js'

/**
 * The days a session can go on, as local Dates; `ready` ("YYYY-MM-DD") is when the files come in.
 * `memberId` is the member being booked (its own time isn't "taken").
 */
export const useBookableDays = (ready = null, memberId = null) =>
  useRows(async () => (await bookableDays(ready, memberId)).map(fromDay), `bookable:${ready}:${memberId}`)

/**
 * One day's start times as [{ time, free, people }]: `people` are the Onboarding Members free then.
 * `memberId` is the member being moved (its own slot isn't "taken").
 */
export const useOpenTimes = (day, memberId) =>
  useRows(
    async () => (day ? (await openTimes(day, memberId)).map((s) => ({ time: s.slot, free: s.room > 0, people: s.free ?? [] })) : []),
    `${day}:${memberId}`,
  )
