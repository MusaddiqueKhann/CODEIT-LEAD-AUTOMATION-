import { Button, cx } from '../ui/index.js'

/** A pickable chip, date or slot: grey at rest, brand when picked; disabled reads as taken. */
export function Option({ on, className, ...rest }) {
  return (
    <Button
      variant="bare"
      aria-pressed={on}
      className={cx(
        'transition disabled:cursor-not-allowed disabled:bg-surface disabled:text-faint disabled:line-through',
        on ? 'bg-brand-700 text-white' : 'bg-field text-ink hover:bg-surface-hover',
        className,
      )}
      {...rest}
    />
  )
}
