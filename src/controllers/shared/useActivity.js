import { listActivity } from '../../models/data/members.js'
import { useRows } from './useRows.js'

/** A member's activity log, newest first. */
export const useActivity = (memberId) =>
  useRows(() => (memberId ? listActivity(memberId) : Promise.resolve(null)), `activity:${memberId}`)
