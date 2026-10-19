import Icon from '../Icon.jsx'
import { cx } from '../../lib/cx.js'

/* With a real ramp, primary / accent / dark are three genuinely different
   fills again, and press states step along the ramp instead of fading opacity.
   Two deliberate departures from the palette's own role table:

   1. Primary carries WHITE, not soft white. Soft white on #347C81 computes to
      4.4990:1 — it misses AA by a thousandth, and the design's own reference
      page flags step 700 as low. At button-label size that is a real failure;
      white is 4.83:1 and passes. Soft white is still correct for large text on
      dark surfaces, which is where the anti-glare argument applies.

   2. Primary hovers DARKER (700 → 800), where the role table says lighter
      (700 → 600). Hovering to 600 would take the label from 4.50:1 to 3.08:1 —
      the button would get harder to read exactly when the pointer is on it.
      800 moves it to 6.42:1 instead. The Primary Hover role token still exists
      verbatim in the palette; it is simply not what a white label sits on. */
const VARIANTS = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900',
  /* Accent is the light seed, so it carries deep ink and darkens on press —
     the mirror of primary, moving up the ramp rather than down. */
  accent: 'bg-accent text-on-brand-dark hover:bg-accent-hover active:bg-accent-active',
  dark: 'bg-deep text-on-brand-light hover:bg-brand-900 active:bg-brand-800',
  outline: 'border border-line bg-panel text-ink hover:bg-surface',
  ghost: 'text-muted hover:bg-surface hover:text-ink',
  danger: 'bg-danger/10 text-danger hover:bg-danger/16',
  onDark: 'bg-white text-brand-800 hover:bg-brand-50',
  onDarkGhost: 'border border-deep-line text-on-brand-light hover:bg-white/10',
  /* Cancel on a step-950 surface (the My Bookings hero row). --danger is
     tuned for white grounds and goes muddy on the deep fill, so the label
     takes the design's soft salmon over a faint white wash instead. */
  dangerOnDark: 'border border-white/20 bg-white/8 text-[#f6b4af] hover:bg-white/15',
  /* For step-700 surfaces, not step-950 ones. --deep-line (#2c6266) is only
     1.43:1 against a 700 fill — it is a rule for the dark card and vanishes
     here. White at 45% gives the boundary something to be, and the label goes
     pure white because soft white is 4.499:1 on 700: below AA at button-label
     size, which is the same reason the primary variant carries white. */
  onBrandGhost: 'border border-white/45 text-white hover:bg-white/15',
}

const SIZES = {
  sm: 'px-3.5 py-2 text-[13px]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-[15px]',
}

/* The chrome every styled variant shares. */
const BASE = cx(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition',
  'disabled:pointer-events-none disabled:opacity-45',
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
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...rest
}) {
  const bare = variant === 'bare'

  return (
    <button
      type={type}
      className={cx(
        !bare && BASE,
        !bare && VARIANTS[variant],
        !bare && SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} className="size-4" strokeWidth={2} />}
      {children}
      {iconRight && <Icon name={iconRight} className="size-4" strokeWidth={2} />}
    </button>
  )
}
