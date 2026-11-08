import Icon from '../../../components/Icon.jsx'
import { cx } from '../../../components/ui/index.js'
import { TONES } from '../../../components/tones.js'

/** A tinted line inside a card: why it came back, that the account exists, a warning. */
export function Notice({ tone, icon, children }) {
  return (
    <p className={cx('flex items-start gap-2.5 rounded-[18px] px-4 py-3.5 text-sm', TONES[tone].fill, TONES[tone].text)}>
      <Icon name={icon} className="mt-0.5 size-4 shrink-0" strokeWidth={1.9} />
      <span>{children}</span>
    </p>
  )
}
