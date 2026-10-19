import { Card } from '../ui/index.js'
import { SHADES } from '../../lib/palette.js'
import { RatioPill } from './RatioPill.jsx'

/** 04 — every token, its pairing and its measured ratio. */
export function TokenTable() {
  const cols = 'grid grid-cols-[1.1fr_1fr_1.4fr_0.8fr] items-center gap-4'

  return (
    <Card
      radius="rounded-[18px]"
      padding="none"
      className="overflow-x-auto shadow-[0_12px_32px_-26px_rgba(18,41,43,0.3)]"
    >
      <div className="min-w-[640px]">
        <div
          className={`${cols} bg-surface-2 px-5.5 py-4 font-mono text-[11px] tracking-[0.14em] text-faint`}
        >
          <div>TOKEN</div>
          <div>HEX</div>
          <div>TEXT COLOR</div>
          <div>CONTRAST</div>
        </div>

        {SHADES.map((shade) => (
          <div
            key={shade.step}
            className={`${cols} border-t border-line-soft px-5.5 py-3.5`}
          >
            <div className="flex items-center gap-3">
              <span
                className="size-6.5 rounded-[7px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
                style={{ background: shade.hex }}
              />
              <span className="font-mono text-[13px] text-ink">{shade.token}</span>
            </div>
            <div className="font-mono text-[13px] text-muted">{shade.hex}</div>
            <div className="flex items-center gap-2">
              <span
                className="size-3.5 shrink-0 rounded border border-black/10"
                style={{ background: shade.text }}
              />
              <span className="font-mono text-[13px] text-ink">{shade.text}</span>
              <span className="text-xs text-faint">{shade.textName}</span>
            </div>
            <div>
              <RatioPill shade={shade} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
