import Icon from '../Icon.jsx'
import { cx } from '../cx.js'
import { TONES } from '../tones.js'

/* sm: in a form or a pop-up. md: a line inside a card. */
const SIZES = {
  sm: 'gap-2 rounded-xl px-3.5 py-3',
  md: 'gap-2.5 rounded-[18px] px-4 py-3.5',
}

/**
 * A tinted line: a form's error, a warning, why a member came back, that a step is done. `tone`
 * colours it, `icon` leads it (null for none), `role` is "alert" for an error the reader must
 * hear, "status" for a quiet confirmation. Nothing to say, nothing shown.
 */
export function Notice({ tone = 'danger', icon = 'alert', size = 'sm', align = 'start', role, strokeWidth = 1.9, className, children }) {
  if (!children) return null
  return (
    <p role={role} className={cx('ui-notice', `ui-notice--${tone}`, 'flex text-sm', align === 'center' ? 'items-center' : 'items-start', SIZES[size], TONES[tone].fill, TONES[tone].text, className)}>
      {icon && <Icon name={icon} className={cx('size-4 shrink-0', align !== 'center' && 'mt-0.5')} strokeWidth={strokeWidth} />}
      {size === 'md' ? <span>{children}</span> : children}
    </p>
  )
}
