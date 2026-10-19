import { cx } from '../../lib/cx.js'
import { TONE_DOT, TONES } from '../../lib/tones.js'

const SIZES = {
  sm: 'px-2.5 py-0.5 text-[12px]',
  md: 'px-3 py-1 text-[13px]',
}

/**
 * A status chip.
 *
 * `dot` switches from a filled chip to a neutral chip carrying a coloured dot.
 * That variant exists because in a list every row's label should sit at the
 * same 14:1 — letting the fill vary per row makes some statuses look louder
 * than others when they are all just metadata. The dot carries the colour, the
 * text stays ink. Use `dot` inside lists, the filled form for a lone status.
 */
export function Badge({ tone = 'neutral', size = 'md', dot = false, className, children }) {
  const t = TONES[tone] ?? TONES.neutral

  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-2 rounded-full font-medium whitespace-nowrap',
        SIZES[size],
        dot ? 'bg-surface-2 text-ink' : cx(t.fill, t.text),
        className,
      )}
    >
      {dot && <span className={cx('size-1.75 shrink-0 rounded-full', TONE_DOT[tone])} />}
      {children}
    </span>
  )
}
