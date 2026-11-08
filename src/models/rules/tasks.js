import { dayKey, fromServer, riyadhNow } from './format.js'

/* The ready checks a failing one asks Sales for, in order; their words are tasks.needs.<key>. */
const NEEDS = ['details', 'requirements', 'documents', 'account', 'hardware', 'session']

/**
 * What this person has to do on a member, or null when nothing is waiting on them. A member waits
 * on whoever has it now (`holderId`, the server's rule), and on its Account Member while the CODEIT
 * account is still to make. Returns { step, tab, at, todo, due }: the step the work belongs to, the
 * member tab it is done on (and `at`, the card on it to land on, if any), the words, and the day it
 * is due ("YYYY-MM-DD", or null).
 * `labelOf(list, key)` names options; `setupKeys` are the setup checklist's keys; `product` names the
 * product customers get an account on (Settings → Company); `t(key, values)` gives the words.
 */
export function taskOf(m, me, { labelOf, setupKeys, product, t }) {
  if (m.outcome || m.stage === 'closed') return null
  if (m.stage === 'collecting' && m.accountPersonId === me && !m.accountCreatedAt) {
    return { step: 'setup', tab: 'setup', todo: t('tasks.todo.createAccount', { product }), due: m.transferDeadline }
  }
  if (m.holderId !== me) return null
  const list = (words) => words.join(t('tasks.todo.listJoin'))
  switch (m.stage) {
    case 'collecting': {
      const missing = NEEDS.filter((k) => !m.ready?.[k])
      const missed = !m.sentBackReason && m.noShows > 0 && !m.session
      const todo = m.sentBackReason
        ? t('tasks.todo.sentBack', { reason: m.sentBackReason })
        : missed
          ? t('tasks.todo.missed')
          : missing.length
            ? t('tasks.todo.stillNeeded', { list: list(missing.map((k) => t(`tasks.needs.${k}`, { product }))) })
            : t('tasks.todo.ready')
      return { step: 'sales', tab: 'sales', at: missed ? 'pick-time' : 'ready', todo, due: m.transferDeadline }
    }
    case 'integration': {
      const left = m.integrations.filter((k) => !(m.integrationChecks?.[k]?.connected && m.integrationChecks?.[k]?.tested))
      const todo = left.length
        ? t('tasks.todo.connect', { names: list(left.map((k) => labelOf('integration', k))) })
        : t('tasks.todo.handOver', { step: labelOf('step', 'onboarding') })
      return { step: 'integration', tab: 'integration', todo, due: m.integrationDue }
    }
    case 'setup': {
      const done = setupKeys.filter((k) => m.setupChecks?.[k]).length
      return { step: 'onboarding', tab: 'onboarding', todo: t('tasks.todo.setup', { done, total: setupKeys.length }), due: m.setupDue }
    }
    case 'session': {
      const day = m.session && dayKey(m.session.date)
      const todo = day && day < dayKey(riyadhNow()) ? t('tasks.todo.markSession') : m.session ? t('tasks.todo.runAt', { time: m.session.time }) : t('tasks.todo.run')
      return { step: 'onboarding', tab: 'onboarding', todo, due: day }
    }
    case 'recording':
      return { step: 'onboarding', tab: 'onboarding', todo: t('tasks.todo.sendRecording'), due: m.completedAt ? dayKey(fromServer(m.completedAt)) : null }
    default:
      return null
  }
}
