import { Card } from './Card.jsx'
import Icon from '../Icon.jsx'
import { IconTile } from './IconTile.jsx'
import { cx } from '../../lib/cx.js'
import { CARD_FILL, CARD_TONE, TONES } from '../../lib/tones.js'

/**
 * A labelled figure with an optional footer (meter, link, or caption).
 *
 * `value` is rendered here rather than passed as children so every stat in the
 * grid lands on the same 34px/bold/leading-none figure — that consistency is
 * the whole point of the row, and it was previously re-typed per card.
 * `suffix` carries the "/3" in "2/3" at a smaller size.
 *
 * Two surface treatments, both off by default so plain white stays the norm
 * (the Payments stats, for one, stay flat):
 *   `toned`  — a soft tone wash from CARD_TONE, in `tone`.
 *   `filled` — a deep per-tone fill from CARD_FILL, in `tone`, carrying white.
 * `filled` wins if both are set. Either way the hue comes from `tone`, so a
 * filled row still colour-codes each metric — just on a dark ground.
 */
export function StatCard({
  label,
  icon,
  tone = 'brand',
  toned = false,
  filled = false,
  value,
  suffix,
  children,
  className,
}) {
  const surface = filled
    ? CARD_FILL[tone] ?? CARD_FILL.brand
    : toned
      ? CARD_TONE[tone] ?? CARD_TONE.brand
      : undefined

  /* On a toned card the text takes the tone's own colour instead of ink/muted,
     so the whole card reads in one hue. These are the same AA-tuned tone texts
     the chips use (lib/tones.js); on the lighter CARD_TONE wash they clear AA by
     a wider margin than on the /12 chip fill. Filled cards keep white; plain
     white cards (toneText null) keep ink/muted. */
  const toneText = toned && !filled ? TONES[tone]?.text ?? TONES.brand.text : null

  return (
    <Card surface={surface} className={cx('flex flex-col', className)}>
      <div className="flex items-start justify-between gap-3">
        {/* Stat labels *name* data, so on white they take --muted, never
            --faint (see index.css). On the 700 fill they take pure white:
            soft white is 4.499:1 there, below AA at this 11px size — the same
            thousandth-of-a-point miss the hero documents. On a toned card they
            take the tone text. */}
        <p className={cx('eyebrow mt-1.5', filled ? 'text-white' : toneText ?? 'text-muted')}>
          {label}
        </p>
        {icon &&
          (filled ? (
            /* The tone-washed IconTile is built for light surfaces; on the fill
               it disappears. So the tile becomes a translucent-white square with
               a white glyph — the hero's own on-dark control treatment. */
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/15 text-white">
              <Icon name={icon} className="size-4" strokeWidth={1.9} />
            </span>
          ) : (
            <IconTile name={icon} tone={tone} size="sm" />
          ))}
      </div>

      <p
        className={cx(
          'mt-2.5 text-[34px] leading-none font-bold',
          filled ? 'text-white' : toneText ?? 'text-ink',
        )}
      >
        {value}
        {/* The suffix dims one step below the figure. On the fill that step is
            soft white (4.5:1, legal because 20px semibold is large text); on
            white it is --faint. */}
        {suffix && (
          <span className={cx('text-xl font-semibold', filled ? 'text-on-brand-light' : 'text-faint')}>
            {suffix}
          </span>
        )}
      </p>

      {/* mt-auto so a meter and a caption bottom-align across the grid even when
          one card's figure wraps and another's does not. On a toned card the
          footer inherits the tone colour, so a caption or link passed as
          children reads in-hue without each call site restating it — provided
          that child does not set its own text colour. */}
      {children && <div className={cx('mt-auto pt-5', toneText)}>{children}</div>}
    </Card>
  )
}
