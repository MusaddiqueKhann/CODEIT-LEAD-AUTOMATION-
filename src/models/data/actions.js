import { rpc } from './rows.js'

/*
 * One function per button. Each calls its server function, which checks the permission and
 * writes the activity, alerts and jobs; a refusal comes back as a sentence to show.
 */

export const updateMember = (id, patch) => rpc('update_member', { p_member: id, p: patch })
export const bookSession = (id, at) => rpc('book_session', { p_member: id, p_at: at })
export const setAccount = (id, codeitId) => rpc('set_account', { p_member: id, p_codeit_id: codeitId })
export const unsetAccount = (id) => rpc('unset_account', { p_member: id })
export const setAccountCheck = (id, key, on) => rpc('set_account_check', { p_member: id, p_key: key, p_on: on })
export const setCustomerSignedIn = (id, on) => rpc('set_customer_signed_in', { p_member: id, p_on: on })
/** Join Meet was pressed: the first press is when the session started. */
export const joinSession = (id) => rpc('join_session', { p_member: id })
/** Hardware moved on (Ordered → Arriving → Delivered), allowed until Closed even after Transfer. */
export const setHardware = (id, hardware) => rpc('set_hardware', { p_member: id, p_hardware: hardware })
export const transfer = (id) => rpc('transfer', { p_member: id })
export const markLost = (id, reason, note) => rpc('mark_lost', { p_member: id, p_reason: reason, p_note: note })
export const reopen = (id) => rpc('reopen', { p_member: id })
export const setIntegrationCheck = (id, key, check) => rpc('set_integration_check', { p_member: id, p_key: key, p_check: check })
export const handToOnboarding = (id) => rpc('hand_to_onboarding', { p_member: id })
export const sendBack = (id, reason) => rpc('send_back', { p_member: id, p_reason: reason })
export const setSetupCheck = (id, key, done) => rpc('set_setup_check', { p_member: id, p_key: key, p_done: done })
export const completeSession = (id) => rpc('complete_session', { p_member: id })
export const noShow = (id, note) => rpc('no_show', { p_member: id, p_note: note })
export const sendRecording = (id, link, reason) => rpc('send_recording', { p_member: id, p_link: link, p_reason: reason })
export const extendLink = (id, hours) => rpc('extend_link', { p_member: id, p_hours: hours })
export const cancelMember = (id, reason) => rpc('cancel_member', { p_member: id, p_reason: reason })
export const changePerson = (id, role, person) => rpc('change_person', { p_member: id, p_role: role, p_person: person })
export const addNote = (id, text) => rpc('add_note', { p_member: id, p_text: text })
/** A new password for the customer's CODEIT login (before the account is made); returns it. */
export const newCodeitPassword = (id) => rpc('new_codeit_password', { p_member: id })
export const saveOnboardingFeedback = (id, text) => rpc('save_onboarding_feedback', { p_member: id, p_text: text })

/** Everyone who could hold a role on a member, free first: [{ id, name, free, reason, openCount }]. Admin only. */
export const personOptions = async (id, role) =>
  (await rpc('person_options', { p_member: id, p_role: role })).map((p) => ({ ...p, openCount: p.open_count }))

/**
 * The days a session can be booked on ("YYYY-MM-DD"); `ready` is the day the files come in, when
 * known. `memberId` is the member being booked, so its own time counts as free.
 */
export const bookableDays = (ready = null, memberId = null) => rpc('bookable_days', { p_ready: ready, p_member: memberId })

/** Every start time on a day, with its room (0 = full) and who is free. `memberId` is the member being moved. */
export const openTimes = (day, memberId = null) => rpc('open_times', { p_day: day, p_member: memberId })
