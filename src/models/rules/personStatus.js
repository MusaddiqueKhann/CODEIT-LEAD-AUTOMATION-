import { formatShort, formatTime, fromDay, fromServer } from './format.js'

/** Where someone is, as [words, tone]: turned off, locked out, not signed in yet, on leave, leave coming, or active. `t` gives the words. */
export function personStatus(p, t) {
  if (!p.active) return [t('admin.team.status.inactive'), 'neutral']
  if (p.lockedUntil) return [t('admin.team.status.lockedUntil', { time: formatTime(fromServer(p.lockedUntil)) }), 'danger']
  if (p.mustChangePassword) return [t('admin.team.status.notSignedIn'), 'warn']
  if (p.onLeaveUntil) return [t('admin.team.status.onLeaveUntil', { date: formatShort(fromDay(p.onLeaveUntil)) }), 'warn']
  if (p.nextLeaveFrom) return [t('admin.team.status.leaveFrom', { date: formatShort(fromDay(p.nextLeaveFrom)) }), 'brand']
  return [t('admin.team.status.active'), 'success']
}
