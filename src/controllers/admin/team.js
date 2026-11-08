import { teamOverview } from '../../models/data/team.js'
import { useRows } from '../shared/useRows.js'

/** Everyone on the team, with status, open members, sessions this week and leave. Admin only. */
export const useTeam = () => useRows(teamOverview, 'team')

/* The Admin's people actions (the admin-users server function and the team RPCs). */
export { addPerson, changeEmail, moveMembers, resetPassword, setActive, setRole, setTeamNote, unlockPerson } from '../../models/data/team.js'
export { addLeave, removeLeave, setHours } from '../shared/useLeave.js'
