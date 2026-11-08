import { cx } from '../cx.js'
import { initials } from '../../models/rules/time.js'

/** A member's initials on a brand wash; `size` carries the box, radius and type size together. */
export function MemberAvatar({ name, size }) {
  return <span className={cx('grid shrink-0 place-items-center bg-brand-100 font-medium text-brand-700', size)}>{initials(name)}</span>
}
