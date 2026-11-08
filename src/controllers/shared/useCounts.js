import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { myCounts, onAlertsChange } from '../../models/data/alerts.js'
import { useRows } from './useRows.js'

/**
 * The sidebar's numbers. They refresh when you move between pages, when one of your alerts
 * arrives or is read (live), and once a minute.
 */
export function useCounts(personId) {
  const { pathname } = useLocation()
  const { data, reload } = useRows(myCounts, 'counts')

  useEffect(() => reload(), [pathname, reload])
  useEffect(() => onAlertsChange(personId, reload), [personId, reload])
  useEffect(() => {
    const t = setInterval(reload, 60000)
    return () => clearInterval(t)
  }, [reload])

  return data ?? {}
}
