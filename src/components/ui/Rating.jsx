import { useState } from 'react'
import { Star } from '../Icon.jsx'
import { cx } from '../../lib/cx.js'

const SIZES = { sm: 'size-4', md: 'size-6', lg: 'size-7' }

/* The empty star is --faint: it is decorative until filled, which is exactly
   the case index.css reserves that token for. The filled one takes warn rather
   than a brand step — a rating is not a brand signal, and the seed (#7ECED3,
   1.80:1 on white) is too light to read as a filled shape at all. */
function Pip({ filled, size, fill }) {
  return (
    <Star filled={filled} className={cx(SIZES[size], filled ? fill : 'text-faint')} />
  )
}

/**
 * A five-point star rating, built on the existing Star glyph in Icon.jsx.
 *
 * Renders as a radiogroup rather than five loose buttons so a screen reader
 * announces one control with a value instead of five unrelated ones.
 *
 * With `readOnly` it collapses to a static row — a rating already given is
 * data, not a control, and shouldn't sit in the tab order. The Feedback page
 * shows both forms in the same list, which is why this is one component.
 *
 * `boxed` puts each star in its own segmented box — the Feedback hero's picker
 * — in place of the loose row. There the lit colour follows the value (a 1 is
 * bad-red, a 5 brand teal), so the caller passes `fill` for the lit star and
 * `boxFill` for the lit box per value. `onHover` reports the star under the
 * pointer (0 on leave) so a parent can preview the same value elsewhere, the
 * way the hero's ring does.
 */
export function Rating({
  value = 0,
  onChange,
  size = 'md',
  readOnly = false,
  className,
  /* Filled-star colour. Defaults to warn so existing call sites are unchanged;
     the Feedback page passes its sentiment scale instead. */
  fill = 'text-warn',
  boxed = false,
  boxFill,
  onHover,
}) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  const hoverTo = (n) => {
    setHover(n)
    onHover?.(n)
  }

  if (readOnly) {
    return (
      <div
        className={cx('flex items-center gap-1', className)}
        role="img"
        aria-label={`Rated ${value} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Pip key={n} filled={n <= value} size={size} fill={fill} />
        ))}
      </div>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className={cx('flex items-center', boxed ? 'gap-2' : 'gap-1', className)}
      onMouseLeave={() => hoverTo(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= shown
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => hoverTo(n)}
            className={
              boxed
                ? cx(
                    'flex size-11 items-center justify-center rounded-xl border transition',
                    on ? boxFill : 'border-line bg-panel hover:bg-surface',
                  )
                : 'rounded-md p-0.5 transition hover:scale-110'
            }
          >
            {boxed ? (
              /* Fixed 20px glyph: the box, not SIZES, sets the scale here. */
              <Star filled={on} className={cx('size-5', on ? fill : 'text-faint')} />
            ) : (
              <Pip filled={on} size={size} fill={fill} />
            )}
          </button>
        )
      })}
    </div>
  )
}
