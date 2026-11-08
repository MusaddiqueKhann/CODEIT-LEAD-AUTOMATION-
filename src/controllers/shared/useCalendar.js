import { listCalendar } from '../../models/data/calendar.js'
import { useRows } from './useRows.js'

/** Calendar items between two days ("YYYY-MM-DD"), reloaded when the range moves; `all` adds everyone's sessions. */
export const useCalendar = (from, to, all) => useRows(() => listCalendar(from, to, all), `${from}:${to}:${all}`)
