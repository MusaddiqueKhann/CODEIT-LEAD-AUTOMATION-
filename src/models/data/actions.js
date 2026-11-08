import { supabase } from './client.js'
import { toError } from './errors.js'

/*
 * One function per button. Each calls its server function, which checks the permission and
 * writes the activity, alerts and jobs; a refusal comes back as a sentence to show.
 */
async function call(fn, args) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw toError(error)
  return data
}

export const updateMember = (id, patch) => call('update_member', { p_member: id, p: patch })
export const bookSession = (id, at) => call('book_session', { p_member: id, p_at: at })
export const setAccount = (id, codeitId) => call('set_account', { p_member: id, p_codeit_id: codeitId })
export const unsetAccount = (id) => call('unset_account', { p_member: id })
export const setAccountCheck = (id, key, on) => call('set_account_check', { p_member: id, p_key: key, p_on: on })
export const setCustomerSignedIn = (id, on) => call('set_customer_signed_in', { p_member: id, p_on: on })
/** Join Meet was pressed: the first press is when the session started. */
export const joinSession = (id) => call('join_session', { p_member: id })
/** Hardware moved on (Ordered → Arriving → Delivered), allowed until Closed even after Transfer. */
export const setHardware = (id, hardware) => call('set_hardware', { p_member: id, p_hardware: hardware })
export const transfer = (id) => call('transfer', { p_member: id })
export const markLost = (id, reason, note) => call('mark_lost', { p_member: id, p_reason: reason, p_note: note })
export const reopen = (id) => call('reopen', { p_member: id })
export const setIntegrationCheck = (id, key, check) => call('set_integration_check', { p_member: id, p_key: key, p_check: check })
export const handToOnboarding = (id) => call('hand_to_onboarding', { p_member: id })
export const sendBack = (id, reason) => call('send_back', { p_member: id, p_reason: reason })
export const setSetupCheck = (id, key, done) => call('set_setup_check', { p_member: id, p_key: key, p_done: done })
export const completeSession = (id) => call('complete_session', { p_member: id })
export const noShow = (id, note) => call('no_show', { p_member: id, p_note: note })
export const sendRecording = (id, link, reason) => call('send_recording', { p_member: id, p_link: link, p_reason: reason })
export const extendLink = (id, hours) => call('extend_link', { p_member: id, p_hours: hours })
export const cancelMember = (id, reason) => call('cancel_member', { p_member: id, p_reason: reason })
export const changePerson = (id, role, person) => call('change_person', { p_member: id, p_role: role, p_person: person })
export const addNote = (id, text) => call('add_note', { p_member: id, p_text: text })
/** A new password for the customer's CODEIT login (before the account is made); returns it. */
export const newCodeitPassword = (id) => call('new_codeit_password', { p_member: id })
export const saveOnboardingFeedback = (id, text) => call('save_onboarding_feedback', { p_member: id, p_text: text })

/** Everyone who could hold a role on a member, free first: [{ id, name, free, reason, openCount }]. Admin only. */
export const personOptions = async (id, role) =>
  (await call('person_options', { p_member: id, p_role: role })).map((p) => ({ ...p, openCount: p.open_count }))

/**
 * The days a session can be booked on ("YYYY-MM-DD"); `ready` is the day the files come in, when
 * known. `memberId` is the member being booked, so its own time counts as free.
 */
export const bookableDays = (ready = null, memberId = null) => call('bookable_days', { p_ready: ready, p_member: memberId })

/** Every start time on a day, with its room (0 = full) and who is free. `memberId` is the member being moved. */
export const openTimes = (day, memberId = null) => call('open_times', { p_day: day, p_member: memberId })
