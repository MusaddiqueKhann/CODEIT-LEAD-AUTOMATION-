import { getMember, listMembers } from '../../models/data/members.js'
import { useRows } from './useRows.js'

/** Every member this person may see. */
export const useMembers = () => useRows(listMembers, 'all')

/** One member by code; `data` is null when it doesn't exist or isn't theirs. */
export const useMember = (code) => useRows(() => getMember(code), code)
