import { useEffect } from 'react'
import { listAlerts, onAlertsChange } from '../../models/data/alerts.js'
import { useRows } from './useRows.js'

/** Your alerts, kept live: a new one shows up without reloading the page. */
export function useAlerts(personId) {
  const alerts = useRows(listAlerts, `alerts:${personId}`)
  const { reload } = alerts
  useEffect(() => onAlertsChange(personId, reload), [personId, reload])
  return alerts
}

export { markRead } from '../../models/data/alerts.js'
