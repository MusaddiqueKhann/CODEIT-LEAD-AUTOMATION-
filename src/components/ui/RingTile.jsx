import { Button } from './Button.jsx'
import { Card } from './Card.jsx'
import { cx } from '../../lib/cx.js'

/**
 * A Ring beside an eyebrow and a caption, in a Card — the stat tile the
 * Overview and the booking page each lay out in threes.
 *
 * `ring` is the Ring element itself, so its own API (size, tone, arc, label)
 * stays where it is documented. `eyebrowClass` colours the label — TONES.*.text
 * for a toned tile, text-accent on the deep gradient. The caption is either
 * `children` (a line of text) or `link`, the "Add sessions →" text link both
 * pages carry, which takes the eyebrow's colour. Anything else (surface,
 * bordered) passes through to Card. Padding is set here as px-5 py-4.5 rather
 * than via Card's `sm` so the two never clash on py.
 */
export function RingTile({
  ring,
  eyebrow,
  eyebrowClass = 'text-muted',
  gap = 'gap-4',
  link,
  className,
  children,
  ...card
}) {
  return (
    <Card padding="none" className={cx('flex items-center px-5 py-4.5', gap, className)} {...card}>
      {ring}
      <div className="min-w-0">
        <p className={cx('eyebrow', eyebrowClass)}>{eyebrow}</p>
        {link ? (
          <Button
            variant="bare"
            onClick={link.onClick}
            className={cx(
              'mt-1 inline-flex items-center gap-1 text-sm font-semibold transition hover:opacity-70',
              eyebrowClass,
            )}
          >
            {link.label} <span aria-hidden="true">→</span>
          </Button>
        ) : (
          children
        )}
      </div>
    </Card>
  )
}
