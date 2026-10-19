import { useId } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * An on/off preference.
 *
 * Built on role="switch" rather than a styled checkbox: the label sits beside
 * the control and describes a setting, not an item being selected, and screen
 * readers announce "on/off" instead of "checked".
 *
 * The track is brand-700 when on (3.9:1 against the panel, clearing the 3:1
 * WCAG 1.4.11 asks of a control boundary) and --line when off. The knob is
 * white in both states so the affordance never disappears.
 */
export function Switch({ checked, onChange, label, description, disabled }) {
  const id = useId()

  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[14px] font-medium text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition',
          'disabled:pointer-events-none disabled:opacity-45',
          checked ? 'bg-brand-700' : 'bg-line',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  )
}
