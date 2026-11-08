import { cx } from '../cx.js'

/* The design's white card: a soft long shadow instead of a hairline, and a 34px corner. The fill
   is kept apart from the frame so a card can wear a tone wash in place of white; it is always
   exactly one background utility (Tailwind settles a bg clash by source order, not class order). */
const DEFAULT_SURFACE = 'bg-panel shadow-card'

const PADDING = {
  none: '',
  sm: 'px-6 py-5',
  md: 'px-6 py-5.5',
  lg: 'px-7 py-6',
}

/**
 * The default surface for content sitting on --canvas.
 *
 * `padding="none"` is for cards whose children run edge to edge — lists, mainly.
 * Those also want `overflow-hidden` so a row's hover fill is clipped to the
 * radius instead of squaring off the corners; pass `clip`.
 *
 * `surface` swaps the default white fill + hairline for another surface token —
 * passed as one class string, never as an override layered on the default
 * (see the note above).
 *
 * `radius` swaps the frame's corner for another rounded-* utility. It replaces
 * rather than layers, for the same source-order reason: rounded-xl happens to
 * be emitted after rounded-2xl, so an override in className would win only by
 * luck. `bordered={false}` drops the hairline outright, for a surface that is
 * borderless in one of its states — the My Bookings hero row, the gradient
 * stat tiles. `border-transparent` is not a substitute: it still adds 1px.
 */
export function Card({
  as: Tag = 'div',
  padding = 'md',
  clip = false,
  radius = 'rounded-card',
  bordered = false,
  surface = DEFAULT_SURFACE,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cx(
        radius,
        bordered && 'border',
        surface,
        PADDING[padding],
        clip && 'overflow-hidden',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
