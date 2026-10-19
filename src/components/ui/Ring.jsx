import { cx } from '../../lib/cx.js'

/* Tone presets for the two arcs. The track and the value arc are separate
   <circle>s so each can carry its own colour — currentColor on one element is
   one value, so the two rings cannot share a class. Both are class-driven
   rather than prop-driven fills, which keeps every ring on the same Aqua·Mist
   tokens the rest of the kit uses. */
const RING_TONE = {
  brand: { arc: 'text-brand-600', track: 'text-brand-100' },
  warn: { arc: 'text-warn', track: 'text-warn/25' },
  success: { arc: 'text-success', track: 'text-success/20' },
  neutral: { arc: 'text-faint', track: 'text-line' },
}

/**
 * A circular gauge — the donut the Overview uses in place of a bar meter.
 *
 * `value` is clamped to `max` rather than trusted, so a count that runs
 * past its axis (an all-time attended total against a per-cycle max) simply
 * reads full instead of overflowing the arc. `arc` / `track` override the tone
 * presets for surfaces the presets were not tuned against — the free-sessions
 * ring sits on a mint card, where a white track reads where brand-100 would
 * vanish. Anything passed as children is centred inside the ring.
 */
export function Ring({
  value,
  max,
  tone = 'brand',
  size = 64,
  thickness = 6,
  arc,
  track,
  label,
  className,
  children,
}) {
  const safeMax = max > 0 ? max : 1
  const pct = Math.min(Math.max(value, 0), safeMax) / safeMax
  const r = (size - thickness) / 2
  const circ = 2 * Math.PI * r
  const t = RING_TONE[tone] ?? RING_TONE.brand

  return (
    <div className={cx('relative shrink-0', className)} style={{ width: size, height: size }}>
      {/* Rotated so the arc grows from 12 o'clock rather than 3 o'clock. */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className={track ?? t.track}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          className={cx('transition-[stroke-dasharray] duration-700', arc ?? t.arc)}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  )
}
