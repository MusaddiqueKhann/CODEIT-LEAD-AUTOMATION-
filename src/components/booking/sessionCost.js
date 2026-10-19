import { formatShort } from '../../lib/format.js'

/** What this booking will draw on — shown on the rail and on the review screen. */
export function sessionCost({ moving, allowance, from }) {
  if (moving) {
    return {
      title: 'Free move',
      subtitle: `From ${formatShort(from.date)}, ${from.time}`,
    }
  }
  if (allowance.freeLeft > 0) {
    return {
      title: 'Uses 1 free session',
      subtitle: `${allowance.freeLeft - 1} of ${allowance.freeTotal} free left after this`,
    }
  }
  if (allowance.paidBalance > 0) {
    return {
      tone: 'warn',
      title: 'Uses 1 paid session',
      subtitle: `${allowance.paidBalance - 1} paid left after this`,
    }
  }
  return {
    tone: 'danger',
    title: 'No sessions left',
    subtitle: 'Add sessions to confirm this booking',
  }
}
