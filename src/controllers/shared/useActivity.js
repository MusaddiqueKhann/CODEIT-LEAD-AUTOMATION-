import { listActivity, listRecentActivity } from '../../models/data/members.js'
import { useConfig } from './ConfigContext.jsx'
import { useRows } from './useRows.js'

/** A member's activity log, newest first. */
export const useActivity = (memberId) =>
  useRows(() => (memberId ? listActivity(memberId) : Promise.resolve(null)), `activity:${memberId}`)

/** Everyone's activity over the Admin's "recent" window (Settings → Timing → Dashboards), for the dashboards. */
export function useRecentActivity() {
  const { settings } = useConfig()
  const days = settings.recentDays
  return useRows(() => listRecentActivity(new Date(Date.now() - days * 864e5).toISOString()), `activity:${days}d`)
}
