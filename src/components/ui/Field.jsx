import { useId } from 'react'
import Icon from '../Icon.jsx'
import { cx } from '../../lib/cx.js'

/* Fields are recessed against the white panel, so they take --surface rather
   than a border-only treatment: on a Card the box has to read as "you can type
   here" before it is focused. --canvas is step 50 and sits *above* --surface in
   the background order (see index.css), which is why the field fill is the grey
   and not the tint — a tinted field on a tinted canvas reads as raised. */
const CONTROL = cx(
  'w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-ink transition',
  'placeholder:text-faint',
  'focus:border-brand-500 focus:bg-panel focus:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

const OK = 'border-line'
/* The error border is the full-strength danger, not the /35 used by soft-filled
   chips: this is a control boundary, and WCAG 1.4.11 asks 3:1 of it. */
const BAD = 'border-danger'

/**
 * Label + control + hint/error, wired together.
 *
 * The id is generated here and handed to the child through a render prop, so a
 * call site cannot forget to link the label to its control — the usual failure
 * that makes a form unusable with a screen reader. `error` replaces `hint`
 * rather than stacking, and is announced via aria-describedby either way.
 *
 * `action` sits at the far end of the label row — the login form's "Forgot
 * password?" — without becoming part of the label's accessible name.
 */
export function Field({ label, hint, error, required, action, children, className }) {
  const id = useId()
  const describedBy = error || hint ? `${id}-desc` : undefined

  const heading = (
    <label htmlFor={id} className="text-[13px] font-semibold text-ink">
      {label}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
  )

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {action ? (
        <div className="flex items-center justify-between">
          {heading}
          {action}
        </div>
      ) : (
        heading
      )}

      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}

      {(error || hint) && (
        <p id={describedBy} className={cx('text-xs', error ? 'text-danger' : 'text-muted')}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

/**
 * The text control. `icon` draws a glyph inside the box's left padding (the
 * sign-in form's mail and shield), pushing the text right of it; `trailing`
 * is a node laid over the right edge — the show/hide toggle. Either one wraps
 * the input in a positioning div; with neither, the input renders bare.
 */
export function Input({ icon, trailing, error, className, ...rest }) {
  const control = (
    <input className={cx(CONTROL, error ? BAD : OK, icon && 'pl-10', className)} {...rest} />
  )

  if (!icon && !trailing) return control

  return (
    <div className="relative">
      {icon && (
        <Icon
          name={icon}
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint"
        />
      )}
      {control}
      {trailing}
    </div>
  )
}

/** The multi-line control. `rows` sets the resting height; the user can drag it taller. */
export function Textarea({ error, rows = 4, className, ...rest }) {
  return <textarea rows={rows} className={cx(CONTROL, error ? BAD : OK, 'resize-y', className)} {...rest} />
}

/**
 * A native <select> with the platform arrow suppressed and our own chevron
 * drawn on top — the OS arrow does not follow the type ramp and looked pasted
 * on next to the Icon set everywhere else.
 */
export function Select({ error, className, children, ...rest }) {
  return (
    <div className="relative">
      <select
        className={cx(CONTROL, error ? BAD : OK, 'cursor-pointer appearance-none pr-10', className)}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="chevronDown"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  )
}
