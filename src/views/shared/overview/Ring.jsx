/**
 * A ring chart: `parts` ([{ value, color }]) laid round a circle from the top, out of `total`.
 * `children` sit in the middle. Several parts get a hairline gap between them; `round` gives
 * the ends round caps (and several parts a wider gap, so the caps don't touch).
 */
export function Ring({ size, stroke, parts, total, track, round = false, children }) {
  const r = (size - stroke) / 2
  const length = 2 * Math.PI * r
  const gap = parts.filter((p) => p.value > 0).length > 1 ? (round ? stroke + 6 : 2) : 0
  let at = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 rtl:-scale-y-100" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: track }} strokeWidth={stroke} />
        {parts.map((p, i) => {
          const arc = total ? (Math.min(p.value, total) / total) * length : 0
          const from = at
          at += arc
          return arc > 0 ? (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              style={{ stroke: p.color }}
              strokeWidth={stroke}
              strokeLinecap={round ? 'round' : 'butt'}
              strokeDasharray={`${Math.max(0, arc - gap)} ${length}`}
              strokeDashoffset={-from - (round && gap ? stroke / 2 : 0)}
            />
          ) : null
        })}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">{children}</span>
    </div>
  )
}
