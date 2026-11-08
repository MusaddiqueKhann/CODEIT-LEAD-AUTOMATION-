import { createContext, useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { myCounts, onAlertsChange } from '../../models/data/alerts.js'
import { useRows } from './useRows.js'

/** The sidebar's numbers, as the shell loaded them (one load, one live channel, one timer). */
export const CountsContext = createContext({})
export const useCounts = () => useContext(CountsContext)

/**
 * Loads the numbers, for the shell only. They refresh when you move between pages, when one of
 * your alerts arrives or is read (live), and once a minute.
 */
export function useLoadCounts(personId) {
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
