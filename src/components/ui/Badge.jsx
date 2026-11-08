import { cx } from '../cx.js'
import { TONE_DOT, TONES } from '../tones.js'

const SIZES = {
  xs: 'h-6 px-2.5 text-[11px]', // a tag beside a name
  sm: 'h-6.5 px-2.5 text-xs',
  row: 'h-7 px-3 text-xs', // in a list row
  rowTight: 'h-7 px-2.5 text-xs',
  tall: 'h-7.5 px-3 text-xs',
  md: 'h-8 px-3.5 text-[13px]',
}
/* Quiet chips that aren't a status tone: on a white panel, on grey, or pale teal. */
const LOOKS = {
  panel: 'bg-panel text-muted',
  panelSoft: 'bg-panel text-soft',
  panelWarn: cx('bg-panel', TONES.warn.text),
  surface: 'bg-surface text-soft',
  tint: 'bg-tint text-brand-800',
  brandSoft: 'bg-brand-150 text-brand-800',
}

/**
 * A status chip.
 *
 * `dot` switches from a filled chip to a neutral chip carrying a coloured dot.
 * That variant exists because in a list every row's label should sit at the
 * same 14:1 — letting the fill vary per row makes some statuses look louder
 * than others when they are all just metadata. The dot carries the colour, the
 * text stays ink. Use `dot` inside lists, the filled form for a lone status. `look` is a quiet
 * chip instead of a tone (LOOKS).
 */
export function Badge({ tone = 'neutral', look, size = 'md', dot = false, className, children }) {
  const t = TONES[tone] ?? TONES.neutral

  return (
    <span
      className={cx(
        'ui-badge',
        `ui-badge--${look ?? (dot ? 'dot' : tone)}`,
        'inline-flex shrink-0 items-center gap-2 rounded-full whitespace-nowrap',
        SIZES[size],
        look ? LOOKS[look] : dot ? 'bg-surface-2 text-ink' : cx(t.fill, t.text),
        className,
      )}
    >
      {dot && <span className={cx('size-1.75 shrink-0 rounded-full', TONE_DOT[tone])} />}
      {children}
    </span>
  )
}
