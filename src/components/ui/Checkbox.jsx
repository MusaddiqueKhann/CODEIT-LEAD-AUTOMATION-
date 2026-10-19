import { cx } from '../../lib/cx.js'

/**
 * A native checkbox with its label beside it — "keep me signed in".
 *
 * Distinct from Switch, which is a setting that takes effect on toggle: this is
 * a choice made once, inside a form, submitted with it. The native control is
 * kept (accent-color'd to brand) rather than redrawn — it is the one place the
 * platform's own affordance is what users expect.
 */
export function Checkbox({ className, children, ...rest }) {
  return (
    <label className={cx('flex items-center gap-2.5 text-sm text-muted select-none', className)}>
      <input
        type="checkbox"
        className="size-4 rounded border-line text-brand-700 accent-brand-700"
        {...rest}
      />
      {children}
    </label>
  )
}
