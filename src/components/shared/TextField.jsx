import { cx } from '../cx.js'

/* Recessed fields: grey at rest, white with a brand inset ring once focused. */
const FIELD = cx(
  'w-full min-w-0 rounded-[14px] bg-field text-sm text-ink outline-none transition',
  'placeholder:text-ghost focus:bg-panel focus:ring-[1.5px] focus:ring-brand-700 focus:ring-inset',
)

/**
 * A labelled text box. A value that always reads left to right (`dir="ltr"`: an email, a phone, a
 * number) still sits at the start of the box on an Arabic page, so the form stays a mirror.
 */
export function TextField({ label, ...rest }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] text-muted">{label}</span>
      <input className={cx(FIELD, 'h-11 px-4', rest.dir === 'ltr' && 'rtl:text-right')} {...rest} />
    </label>
  )
}
