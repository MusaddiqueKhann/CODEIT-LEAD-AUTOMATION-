import { Card } from '../ui/index.js'

/** 03 — the system doing actual UI work. */
export function InProduct() {
  return (
    <div className="mb-9 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card
        radius="rounded-[20px]"
        padding="none"
        className="p-8 shadow-[0_16px_40px_-30px_rgba(18,41,43,0.3)]"
      >
        <div className="mb-5 font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
          Buttons &amp; badges
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* White rather than soft white: 4.83:1 vs 4.499:1 at this size. */}
          <span className="rounded-[10px] bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-8px_rgba(52,124,129,0.6)]">
            Primary
          </span>
          <span className="rounded-[10px] bg-brand-100 px-5 py-2.5 text-sm font-semibold text-brand-800">
            Secondary
          </span>
          <span className="rounded-[10px] border border-brand-300 px-5 py-2.5 text-sm font-semibold text-brand-700">
            Ghost
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <span className="rounded-full bg-brand-100 px-2.5 py-1 font-mono text-[11px] text-brand-800">
            ● Active
          </span>
          <span className="rounded-full bg-brand-400 px-2.5 py-1 font-mono text-[11px] text-on-brand-dark">
            Beta
          </span>
          <span className="rounded-full bg-brand-950 px-2.5 py-1 font-mono text-[11px] text-brand-300">
            Enterprise
          </span>
        </div>

        <Card
          radius="rounded-xl"
          padding="none"
          surface="border-brand-200 bg-brand-50"
          className="mt-6 flex items-start gap-3 px-4.5 py-4"
        >
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" />
          <div>
            <div className="text-sm font-semibold text-brand-800">Sync complete</div>
            <div className="mt-0.5 text-[13px] text-muted">All 240 records updated a moment ago.</div>
          </div>
        </Card>
      </Card>

      <Card
        radius="rounded-[20px]"
        padding="none"
        surface="border-deep-line bg-deep"
        className="p-8 shadow-[0_16px_40px_-26px_rgba(18,48,51,0.6)]"
      >
        <div className="mb-5 font-mono text-[10px] tracking-[0.2em] text-brand-400 uppercase">
          Dark surface
        </div>
        <div className="text-[30px] leading-tight text-on-brand-light">Usage this month</div>
        <div className="mt-1.5 text-sm text-deep-muted">
          Soft-white text ({'#EAFAFA'}) on step 950.
        </div>

        {/* Steps 800 → 400 climbing, so the bars read as one hue getting
            brighter rather than five unrelated colours. */}
        <div className="mt-6.5 flex h-22 items-end gap-2">
          {[
            ['44%', '#2c6266'],
            ['62%', '#347c81'],
            ['54%', '#419aa0'],
            ['82%', '#5bb7bd'],
            ['100%', '#7eced3'],
          ].map(([height, background]) => (
            <div
              key={background}
              className="flex-1 rounded-t-md"
              style={{ height, background }}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}
