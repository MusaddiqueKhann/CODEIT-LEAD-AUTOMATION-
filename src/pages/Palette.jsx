import {
  InProduct,
  PaletteHero,
  RoleCard,
  SectionLabel,
  ShadeCard,
  TextPairings,
  TokenTable,
} from '../components/palette/index.js'
import { ROLES, SHADES } from '../lib/palette.js'

/* The living reference for the Aqua·Mist system, ported from the Claude
   Design project's Palette.dc.html. Every swatch, ratio and pairing is
   computed from src/lib/palette.js rather than hardcoded, so this page cannot
   drift from the tokens in index.css.

   Swatch fills are inline styles on purpose: the ramp is data, and Tailwind
   cannot generate a class from a value it only sees at runtime. */

export default function Palette() {
  return (
    <div className="pb-4">
      <PaletteHero />

      <SectionLabel>01 — The Ramp · 50 → 950</SectionLabel>
      <div className="mb-20 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(196px,1fr))]">
        {SHADES.map((shade) => (
          <ShadeCard key={shade.step} shade={shade} />
        ))}
      </div>

      <SectionLabel>02 — Semantic Roles</SectionLabel>
      <div className="mb-20 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]">
        {ROLES.map((role) => (
          <RoleCard key={role.name} role={role} />
        ))}
      </div>

      <SectionLabel>03 — In Product</SectionLabel>
      <InProduct />
      <TextPairings />

      <SectionLabel>04 — Token Reference</SectionLabel>
      <TokenTable />
    </div>
  )
}
