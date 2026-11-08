import { useConfig } from './ConfigContext.jsx'
import { useLang } from './LangContext.jsx'
import * as api from '../../models/data/actions.js'
import { fileUrl, removeDocument } from '../../models/data/files.js'
import { saveMember } from '../../models/data/members.js'
import { useAction } from './useAction.js'

/**
 * Every button on a member, ready to call: each runs its server action, toasts the result and
 * then calls `after` (a reload). Each resolves true when it worked, so a dialog knows to close.
 * The server decides what is allowed; the screen only shows what `member.actions` lists.
 */
export function useMemberActions(member, after) {
  const { run, busy } = useAction(after)
  const { label } = useConfig()
  const { t } = useLang()
  const sales = label('step', 'sales')
  const id = member?.id

  return {
    busy,
    save: (draft) => run(() => saveMember(member, draft), t('shared.actions.saved')),
    book: (at) => run(() => api.bookSession(id, at), t('shared.actions.booked')),
    setAccount: (codeitId) => run(() => api.setAccount(id, codeitId), t('shared.actions.accountCreated', { sales })),
    unsetAccount: () => run(() => api.unsetAccount(id), t('shared.actions.accountUnticked')),
    accountCheck: (key, on) => run(() => api.setAccountCheck(id, key, on)),
    signedIn: (on) => run(() => api.setCustomerSignedIn(id, on), t(on ? 'shared.actions.signedIn' : 'shared.actions.signedInOff')),
    // Quiet: the Meet opens in its own tab; this only notes when the session started.
    join: () => api.joinSession(id).catch(() => {}),
    hardware: (value) => run(() => api.setHardware(id, value)),
    removeDocument: (kind) => run(() => removeDocument(id, kind), t('shared.actions.fileRemoved')),
    transfer: () => run(() => api.transfer(id), t('shared.actions.transferred')),
    lost: (reason, note) => run(() => api.markLost(id, reason, note), t('shared.actions.lost')),
    reopen: () => run(() => api.reopen(id), t('shared.actions.reopened', { sales })),
    integrationCheck: (key, check) => run(() => api.setIntegrationCheck(id, key, check)),
    handOver: () => run(() => api.handToOnboarding(id), t('shared.actions.handedOver', { step: label('step', 'onboarding') })),
    sendBack: (reason) => run(() => api.sendBack(id, reason), t('shared.actions.sentBack')),
    setupCheck: (key, done) => run(() => api.setSetupCheck(id, key, done)),
    complete: () => run(() => api.completeSession(id), t('shared.actions.completed')),
    noShow: (note) => run(() => api.noShow(id, note), t('shared.actions.noShow', { sales })),
    sendRecording: (link, reason) => run(() => api.sendRecording(id, link, reason), t('shared.actions.recordingSent')),
    extend: (hours) => run(() => api.extendLink(id, hours), t('shared.actions.extended', { n: hours })),
    cancel: (reason) => run(() => api.cancelMember(id, reason), t('shared.actions.cancelled')),
    changePerson: (role, person) => run(() => api.changePerson(id, role, person), t('shared.actions.personChanged')),
    note: (text) => run(() => api.addNote(id, text), t('shared.actions.noteAdded')),
    newPassword: () => run(() => api.newCodeitPassword(id), t('shared.actions.newPassword')),
    feedback: (text) => run(() => api.saveOnboardingFeedback(id, text), t('shared.actions.feedbackSaved')),
    /** The Admin's picker list for a role (no toast: it only reads). */
    options: (role) => api.personOptions(id, role),
    /** A link to look at a stored document. */
    openFile: (file, download) => fileUrl(file.path, download && file.name),
  }
}

/** "Join Meet" from a dashboard: records that the session started (once). */
export { joinSession } from '../../models/data/actions.js'
