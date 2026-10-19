import { Card } from '../ui/index.js'
import { DARKEST, LIGHTEST, SEED, hexToRgb } from '../../lib/palette.js'

/**
 * The reference's opening row: the "Design System · Color" pill, the Aqua·Mist
 * title and blurb, and the seed token card with its rgb, hue and ramp ends.
 * Everything shown is computed from lib/palette.js, never typed here.
 */
export function PaletteHero() {
  const [r, g, b] = hexToRgb(SEED)

  return (
    <div className="mb-16 flex flex-wrap items-start justify-between gap-10">
      <div className="max-w-[560px]">
        <div className="mb-5.5 inline-flex items-center gap-2.5 rounded-full border border-tint-line bg-panel px-3.5 py-[7px] font-mono text-[11px] tracking-[0.28em] text-brand-600 uppercase shadow-[0_1px_2px_rgba(18,41,43,0.04)]">
          <span className="size-[7px] rounded-full bg-brand-400" />
          Design System · Color
        </div>

        <h1 className="text-[64px] leading-[0.98] font-medium tracking-[-0.025em] text-ink">
          Aqua<span className="text-brand-600">·</span>Mist
        </h1>

        <p className="mt-5 text-[17px] leading-relaxed text-muted">
          A production-ready teal system built from the seed{' '}
          <span className="rounded-md bg-brand-100 px-1.5 py-0.5 font-mono text-brand-800">
            {SEED}
          </span>
          . Eleven tuned steps, semantic roles, and legibility-checked text pairings — drop
          straight into your SaaS UI.
        </p>
      </div>

      {/* Seed token card */}
      <Card
        radius="rounded-[22px]"
        padding="none"
        className="min-w-[270px] p-6.5 shadow-[0_24px_60px_-28px_rgba(18,41,43,0.22)]"
      >
        <div className="mb-3.5 font-mono text-[10px] tracking-[0.22em] text-faint">
          SEED TOKEN
        </div>

        <div className="flex items-center gap-4">
          <div
            className="size-19 rounded-2xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
            style={{ background: SEED }}
          />
          <div className="font-mono text-xs leading-[1.9] text-muted">
            <div className="text-[15px] text-ink">{SEED}</div>
            <div>
              rgb {r} {g} {b}
            </div>
            <div>hue 184° · step 400</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3.5 border-t border-line-soft pt-4.5">
          <div>
            <div className="font-mono text-[10px] tracking-[0.1em] text-faint">LIGHTEST</div>
            <div className="mt-0.5 font-mono text-[13px] text-ink">{LIGHTEST}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.1em] text-faint">DARKEST</div>
            <div className="mt-0.5 font-mono text-[13px] text-ink">{DARKEST}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
