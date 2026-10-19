import Icon from '../Icon.jsx'
import { cx } from '../../lib/cx.js'
import { TONES } from '../../lib/tones.js'

/* Radius is set per size rather than left at one rounded-* value. A squircle
   holds its proportion only if the corner scales with the box: 10px on a 32px
   tile reads the same as 13px on a 40px one, whereas one fixed radius makes the
   small tile look boxy and the large one look like a circle.

   This is also why the tile cannot be composed as cx(BADGE, 'size-8') — two
   arbitrary rounded-* values on one element are resolved by CSS source order,
   not class order, so the override silently loses. */
const SIZES = {
  sm: { box: 'size-8 rounded-[10px]', glyph: 'size-4' },
  md: { box: 'size-10 rounded-[13px]', glyph: 'size-4.5' },
  lg: { box: 'size-12 rounded-[15px]', glyph: 'size-5' },
}

/** The soft-filled glyph square used by list rows, stat cards and notifications. */
export function IconTile({ name, tone = 'brand', size = 'sm', className }) {
  const t = TONES[tone] ?? TONES.brand
  const s = SIZES[size] ?? SIZES.sm

  return (
    <span
      className={cx('flex shrink-0 items-center justify-center', s.box, t.fill, t.text, className)}
    >
      <Icon name={name} className={s.glyph} strokeWidth={1.9} />
    </span>
  )
}
