/** The two text pairings, each shown on a step it actually applies to. */
export function TextPairings() {
  return (
    <div className="mb-20 grid gap-6 md:grid-cols-2">
      <div className="rounded-[18px] bg-brand-200 p-7.5">
        <div className="mb-2.5 font-mono text-[10px] tracking-[0.2em] uppercase text-[#12383b]">
          Dark text · steps 50–600
        </div>
        <div className="text-[26px] leading-tight text-on-brand-dark">Deep ink #0D2B2E</div>
        <p className="mt-2 text-sm leading-relaxed text-[#12383b]">
          On-hue, softer than black, holds AAA contrast on every light step.
        </p>
      </div>

      <div className="rounded-[18px] bg-brand-800 p-7.5">
        <div className="mb-2.5 font-mono text-[10px] tracking-[0.2em] text-brand-400 uppercase">
          Light text · steps 700–950
        </div>
        <div className="text-[26px] leading-tight text-on-brand-light">Soft white #EAFAFA</div>
        <p className="mt-2 text-sm leading-relaxed text-brand-200">
          Avoids the glare of pure white against saturated teal surfaces.
        </p>
      </div>
    </div>
  )
}
