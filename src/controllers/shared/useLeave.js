import { listLeave } from '../../models/data/team.js'
import { useRows } from './useRows.js'

/** One person's leave, soonest first (your own, or anyone's for the Admin). */
export const useLeave = (personId) => useRows(() => listLeave(personId), `leave:${personId}`)

export { addLeave, removeLeave, setHours } from '../../models/data/team.js'
