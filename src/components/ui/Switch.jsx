import { cx } from '../cx.js'

/** The design's on/off switch: teal with the knob right when on, grey when off. */
export function Switch({ id, on, onChange, label, disabled = false, className }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cx('ui-switch relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:cursor-default', on ? 'bg-brand-700' : 'bg-off', className)}
    >
      <span className={cx('absolute top-0.75 size-4.5 rounded-full bg-white shadow-[0_1px_3px_rgb(20_30_50/0.25)] transition-all', on ? 'start-4.75' : 'start-0.75')} />
    </button>
  )
}
