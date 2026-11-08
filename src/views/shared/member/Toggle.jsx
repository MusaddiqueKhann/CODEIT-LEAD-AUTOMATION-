import Icon from '../../../components/Icon.jsx'
import { Button, cx } from '../../../components/ui/index.js'

/**
 * A tick a person sets on a card (Connected, Tested, Waiting on provider): a round box and its
 * words in a pill, teal when on (amber for `warn`). Read-only shows the state only.
 */
export function Toggle({ on, label, onChange, disabled, warn = false }) {
  return (
    <Button
      variant="bare"
      role="checkbox"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cx(
        'flex h-10 items-center gap-2.5 rounded-full ps-2.5 pe-4 text-[13px] whitespace-nowrap transition-colors disabled:cursor-default',
        on ? (warn ? 'bg-warn-bg text-warn-ink' : 'bg-tint text-brand-800') : 'bg-surface text-ink-2 enabled:hover:bg-surface-hover',
      )}
    >
      <span
        className={cx(
          'grid size-5.5 shrink-0 place-items-center rounded-full text-white transition-colors',
          on ? (warn ? 'bg-warn' : 'bg-brand-700') : 'bg-panel ring-[1.5px] ring-[#c9ced8] ring-inset',
        )}
      >
        {on && <Icon name="check" className="size-3" strokeWidth={3} />}
      </span>
      {label}
    </Button>
  )
}
