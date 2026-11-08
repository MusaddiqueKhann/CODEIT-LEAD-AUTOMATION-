import Icon from '../Icon.jsx'
import { cx } from '../cx.js'
import { TONES } from '../tones.js'

/** A form's error or notice, in the danger or warn tone. */
export function FormError({ children, tone = 'danger' }) {
  if (!children) return null
  return (
    <p role="alert" className={cx('flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm', TONES[tone].fill, TONES[tone].text)}>
      <Icon name="alert" className="mt-0.5 size-4 shrink-0" strokeWidth={1.9} />
      {children}
    </p>
  )
}
