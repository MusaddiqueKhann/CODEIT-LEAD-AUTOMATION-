import Icon from '../Icon.jsx'
import { cx } from '../../lib/cx.js'

/**
 * A label + value line with its own copy button — one field of a details list,
 * such as the bank transfer instructions.
 *
 * `onCopy(value, label)` is supplied by the caller rather than read from
 * useCopy here, so the kit stays free of the toast context and the page decides
 * how a copy is reported.
 */
export function CopyRow({ label, value, mono = true, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-soft py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{label}</p>
        <p className={cx('mt-0.5 truncate text-[13px] text-ink', mono && 'font-mono')}>{value}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, label)}
        aria-label={`Copy ${label}`}
        className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink"
      >
        <Icon name="copy" className="size-4" />
      </button>
    </div>
  )
}
