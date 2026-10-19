import { Card } from '../ui/index.js'
import { RatioPill } from './RatioPill.jsx'

/** 01 — a ramp step, shown as a filled well over its own spec. */
export function ShadeCard({ shade }) {
  return (
    <Card
      radius="rounded-[18px]"
      padding="none"
      clip
      className="shadow-[0_8px_24px_-18px_rgba(18,41,43,0.28)]"
    >
      <div
        className="flex h-35 flex-col justify-between p-[18px]"
        style={{ background: shade.hex }}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[13px] opacity-90" style={{ color: shade.text }}>
            {shade.step}
          </span>
          {shade.isSeed && (
            <span
              className="rounded-full border px-2.5 py-[3px] font-mono text-[9px] tracking-[0.14em]"
              style={{ borderColor: shade.text, color: shade.text }}
            >
              SEED
            </span>
          )}
        </div>
        <div className="font-sans text-[26px]" style={{ color: shade.text }}>
          Aa
        </div>
      </div>

      <div className="px-[17px] pt-[15px] pb-[17px]">
        <div className="font-mono text-sm tracking-[0.02em] text-ink">{shade.hex}</div>
        <div className="mt-2.5 flex items-center gap-2">
          <span
            className="size-3.5 rounded border border-black/10"
            style={{ background: shade.text }}
          />
          <span className="text-[11px] text-muted">{shade.textName}</span>
          <RatioPill shade={shade} className="ml-auto" />
        </div>
      </div>
    </Card>
  )
}
