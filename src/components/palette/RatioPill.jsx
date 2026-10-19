/** Ratio pill. Low-contrast steps get an amber treatment, not a teal one. */
export function RatioPill({ shade, className = '' }) {
  const low = shade.level === 'low'
  return (
    <span
      className={`rounded-[5px] px-2 py-0.5 font-mono text-[11px] ${className}`}
      style={{
        background: low ? '#f7ecdb' : '#e2f6f6',
        color: low ? '#9a5a1e' : '#2c6266',
      }}
    >
      {shade.ratio}
    </span>
  )
}
