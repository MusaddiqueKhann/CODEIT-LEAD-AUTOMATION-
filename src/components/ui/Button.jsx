import { cx } from '../cx.js'

/* The design's four buttons: teal, soft grey, white with an inset hairline, and red text for
   removing things. Every one is a pill. A disabled teal button fades to the pale teal the design
   uses rather than to half opacity. */
const VARIANTS = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-200',
  soft: 'bg-surface text-ink hover:bg-surface-hover disabled:text-ghost',
  outline: 'bg-panel text-ink ring-[1.5px] ring-edge ring-inset hover:bg-surface disabled:text-ghost',
  danger: 'text-danger-ink hover:bg-danger-bg disabled:text-ghost',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-10 px-4.5 text-sm',
  lg: 'h-11 px-5 text-sm',
}

/* The chrome every styled variant shares. */
const BASE = cx(
  'inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition',
  'disabled:pointer-events-none',
)

/**
 * The kit's button. `variant` picks a styled surface from the table above and
 * `size` its padding.
 *
 * `variant="bare"` renders the <button> with none of that — no base classes,
 * no size — for the one-off controls whose class string the caller owns: a
 * washed row, a rail step, a slot, a text link. The base classes cannot simply
 * be overridden (justify-center is emitted after justify-between, gap-2 after
 * gap-1), so bare skips them outright. It exists so nothing outside ui/ writes
 * a raw <button>; `size` is ignored on it.
 *
 * With `href` it renders an <a> in the same chrome — "Join Meet" is a link,
 * not an action, so it opens in a new tab and middle-clicks work.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...rest
}) {
  const bare = variant === 'bare'
  const Tag = rest.href ? 'a' : 'button'

  return (
    <Tag
      type={rest.href ? undefined : type}
      className={cx(
        !bare && BASE,
        !bare && VARIANTS[variant],
        !bare && SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
