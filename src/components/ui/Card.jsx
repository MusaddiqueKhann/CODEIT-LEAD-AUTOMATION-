import { cx } from '../../lib/cx.js'

/* A hairline, not a drop shadow. The card sits on a tinted canvas that already
   separates it from the page — a shadow states that a second time, and at 30px
   of blur it reads as depth on a UI that has no other depth cue. 16px radius
   rather than 24px: at 24 a 300px-wide stat card is mostly corner. */

/* The frame every card shares is kept apart from its surface — the fill and
   border colour — so a card can wear a tone wash in place of plain white. They
   have to be separate tokens rather than an override layered on the default:
   Tailwind resolves a bg-panel / bg-brand-50 clash by CSS source order, not
   class order, so `bg-brand-50` after `bg-panel` in a className would win only
   by luck. The surface is therefore always exactly one background utility. */
const DEFAULT_SURFACE = 'border-line bg-panel'

const PADDING = {
  none: '',
  sm: 'px-5 py-4',
  md: 'px-6 py-6',
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
 * a tone wash from CARD_TONE, say — passed as one class string, never as an
 * override layered on the default (see the note above).
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
  radius = 'rounded-2xl',
  bordered = true,
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
