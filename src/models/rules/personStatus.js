import { formatShort, formatTime, fromDay, fromServer } from './format.js'

/** Where someone is, as [words, tone]: turned off, locked out, not signed in yet, on leave, leave coming, or active. `t` gives the words. */
export function statusOf(p, t) {
  if (!p.active) return [t('team.status.inactive'), 'neutral']
  if (p.lockedUntil) return [t('team.status.lockedUntil', { time: formatTime(fromServer(p.lockedUntil)) }), 'danger']
  if (p.mustChangePassword) return [t('team.status.notSignedIn'), 'warn']
  if (p.onLeaveUntil) return [t('team.status.onLeaveUntil', { date: formatShort(fromDay(p.onLeaveUntil)) }), 'warn']
  if (p.nextLeaveFrom) return [t('team.status.leaveFrom', { date: formatShort(fromDay(p.nextLeaveFrom)) }), 'brand']
  return [t('team.status.active'), 'success']
}
