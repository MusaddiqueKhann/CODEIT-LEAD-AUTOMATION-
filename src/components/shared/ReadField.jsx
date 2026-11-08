import { cx } from '../cx.js'

/**
 * A saved value in the same grey box a field uses, for read-only screens. A left-to-right value
 * (`dir="ltr"`) still sits at the start of the box on an Arabic page.
 */
export function ReadField({ label, children, dir }) {
  const box = (
    <span
      dir={dir}
      className={cx(
        'flex min-h-11 items-center rounded-[14px] bg-field px-4 py-2 text-sm leading-snug font-medium text-ink [overflow-wrap:anywhere]',
        dir === 'ltr' && 'rtl:justify-end',
      )}
    >
      {children}
    </span>
  )
  if (!label) return box
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] text-muted">{label}</span>
      {box}
    </div>
  )
}
