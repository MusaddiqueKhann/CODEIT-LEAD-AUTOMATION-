import Icon from '../Icon.jsx'
import { cx } from '../cx.js'
import { Button } from './Button.jsx'

const SIZES = { 5: 'size-5', 5.5: 'size-5.5', 6: 'size-6', 7: 'size-7' }
const SHAPES = { round: 'rounded-full', square: 'rounded-lg' }
/* How an empty box is drawn: on a panel, on a white tile, or in a table (it lights up on hover). */
const EMPTY = {
  panel: 'bg-panel text-white ring-[1.5px] ring-off-ring ring-inset',
  faint: 'ring-[1.5px] ring-faint ring-inset',
  table: 'ring-[1.5px] ring-edge ring-inset peer-hover:ring-brand-300',
}

/** A tick box: teal with a check when `on` (amber for `warn`), an empty ring when not. */
export function Tick({ on, warn = false, size = 5.5, shape = 'round', empty = 'panel', strokeWidth = 3, className, ...rest }) {
  return (
    <span className={cx('ui-tick grid shrink-0 place-items-center', SIZES[size], SHAPES[shape], on ? cx('text-white', warn ? 'bg-warn' : 'bg-brand-700') : EMPTY[empty], className)} {...rest}>
      {on && <Icon name="check" className={size >= 6 ? 'size-3.5' : 'size-3'} strokeWidth={strokeWidth} />}
    </span>
  )
}

/**
 * A tick a person sets on a card (Connected, Tested, Waiting on provider): a round box and its
 * words in a pill, teal when on (amber for `warn`). Disabled shows the state only.
 */
export function TickPill({ id, on, label, onChange, disabled, warn = false }) {
  return (
    <Button
      id={id}
      variant="bare"
      role="checkbox"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cx(
        'ui-tick-pill flex h-10 items-center gap-2.5 rounded-full ps-2.5 pe-4 text-[13px] whitespace-nowrap transition-colors disabled:cursor-default',
        on ? (warn ? 'bg-warn-bg text-warn-ink' : 'bg-tint text-brand-800') : 'bg-surface text-ink-2 enabled:hover:bg-surface-hover',
      )}
    >
      <Tick on={on} warn={warn} className="transition-colors" />
      {label}
    </Button>
  )
}
