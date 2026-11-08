import { camelKeys } from './case.js'
import { supabase } from './client.js'
import { rows } from './rows.js'
import { appError, toError } from './errors.js'

async function call(fn, args) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw toError(error)
  return data
}

/** The admin-users server function (it holds the key that creates sign-ins). Returns its answer or throws its sentence. */
async function manage(body) {
  const { data, error } = await supabase.functions.invoke('admin-users', { body })
  if (error) {
    const said = await error.context?.json?.().catch(() => null)
    throw appError(said?.code ?? null, said?.error ?? error.message)
  }
  return data
}

/** Everyone, with status, open members, sessions this week and leave. Admin only. */
export const teamOverview = async () => (await call('team_overview', {})).map(camelKeys)

/** Adds a person; returns { id, password, emailed }. `hours` is null for office hours. */
export const addPerson = (p) => manage({ action: 'create', ...p })
/** A new temporary password; returns { password, emailed }. */
export const resetPassword = (id) => manage({ action: 'reset', id })
export const setActive = (id, on) => manage({ action: on ? 'reactivate' : 'deactivate', id })
/** A new sign-in email; returns { email, emailed } (both addresses are told). */
export const changeEmail = (id, email) => manage({ action: 'change_email', id, email })
/** Lets a person locked out by wrong passwords try again now. */
export const unlockPerson = (id) => call('unlock_person', { p_person: id })

export const setRole = (id, role) => call('set_role', { p_person: id, p_role: role })
export const setHours = (id, hours) => call('set_hours', { p_person: id, p_hours: hours })
export const setTeamNote = (id, note) => call('set_team_note', { p_person: id, p_note: note })
/** Returns { open, sessions }: what the leave touches (the Admin has been told). */
export const addLeave = (id, from, to) => call('add_leave', { p_person: id, p_from: from, p_to: to })
export const removeLeave = (leaveId) => call('remove_leave', { p_leave: leaveId })
/** Moves a person's open members to `to`, or (null) picks again for each. Returns how many moved. */
export const moveMembers = (from, to) => call('move_members', { p_from: from, p_to: to })

/** One person's leave, soonest first (your own, or anyone's for the Admin). */
export const listLeave = async (id) =>
  (await rows(supabase.from('leave').select('id, starts_on, ends_on').eq('person_id', id).order('starts_on'))).map(camelKeys)
