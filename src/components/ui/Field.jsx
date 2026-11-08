import { useId } from 'react'
import Icon from '../Icon.jsx'
import { cx } from '../cx.js'

/* The design's field: a borderless grey box that turns white with a teal inset ring on focus. */
const CONTROL = cx(
  'w-full rounded-[14px] bg-field px-4 text-sm text-ink outline-none transition',
  'placeholder:text-ghost',
  'focus:bg-panel focus:ring-[1.5px] focus:ring-brand-700 focus:ring-inset',
  'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ghost',
)

const OK = ''
/* An error rings the box in red, the control boundary WCAG 1.4.11 asks 3:1 of. */
const BAD = 'ring-[1.5px] ring-danger ring-inset'

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
    <label htmlFor={id} className="text-[13px] text-soft">
      {label}
      {required && <span className="ms-0.5 text-danger">*</span>}
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
        <p id={describedBy} className={cx('text-xs', error ? 'text-danger-ink' : 'text-muted')}>
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
    <input className={cx(CONTROL, 'h-11', error ? BAD : OK, icon && 'ps-10', className)} {...rest} />
  )

  if (!icon && !trailing) return control

  return (
    <div className="relative">
      {icon && (
        <Icon
          name={icon}
          className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-faint"
        />
      )}
      {control}
      {trailing}
    </div>
  )
}

/** The multi-line control. `rows` sets the resting height; the user can drag it taller. */
export function Textarea({ error, rows = 4, className, ...rest }) {
  return <textarea rows={rows} className={cx(CONTROL, 'py-3 leading-normal', error ? BAD : OK, 'resize-y', className)} {...rest} />
}

/**
 * A native <select> with the platform arrow suppressed and our own chevron drawn on top.
 * `pill` is the design's filter look (a soft grey pill, 14px) for selects that sit in a header
 * or toolbar rather than in a form.
 */
export function Select({ error, pill = false, className, children, ...rest }) {
  return (
    <div className="relative">
      <select
        className={cx(
          pill ? 'h-10 w-full rounded-full bg-surface ps-4 text-[13px] text-ink outline-none transition hover:bg-surface-hover' : cx(CONTROL, 'h-11'),
          error ? BAD : OK,
          'cursor-pointer appearance-none pe-10',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="chevronDown"
        strokeWidth={2.2}
        className="pointer-events-none absolute top-1/2 end-4 size-3.5 -translate-y-1/2 text-soft"
      />
    </div>
  )
}
