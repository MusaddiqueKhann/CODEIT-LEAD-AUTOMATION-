/**
 * Aqua·Mist — the canonical colour system.
 *
 * Imported verbatim from the Claude Design project "Premium Color Palette
 * Guide" (Palette.dc.html). This module is the single source of truth for the
 * palette: src/index.css mirrors these values as CSS custom properties, and
 * src/pages/Palette.jsx renders them as the living reference page.
 *
 * If a value changes, change it HERE first, then mirror into index.css. The
 * ramp below is the only place the hexes are written as literals.
 */

/** The seed the whole system is built from. Sits at step 400, not 500. */
export const SEED = '#7ECED3'

/**
 * Text colours. Deliberately not pure black / pure white:
 *  - deep ink is on-hue, softer than #000, and holds AAA on every light step
 *  - soft white avoids the glare of #fff against saturated teal
 */
export const DEEP_INK = '#0D2B2E'
export const SOFT_WHITE = '#EAFAFA'

/** The eleven tuned steps, 50 → 950. */
export const RAMP = [
  ['50', '#F2FBFB'],
  ['100', '#E2F6F6'],
  ['200', '#C5ECEE'],
  ['300', '#A6DFE2'],
  ['400', '#7ECED3'],
  ['500', '#5BB7BD'],
  ['600', '#419AA0'],
  ['700', '#347C81'],
  ['800', '#2C6266'],
  ['900', '#274F53'],
  ['950', '#123033'],
]

/* ------------------------------------------------------------------ *
 * WCAG relative luminance / contrast. Same maths as the design file,
 * so the numbers this page prints match the ones the design shows.
 * ------------------------------------------------------------------ */

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a, b) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}

/** AAA ≥ 7, AA ≥ 4.5, anything less is fill-only. */
export function level(ratio) {
  return ratio >= 7 ? 'aaa' : ratio >= 4.5 ? 'aa' : 'low'
}

/**
 * Each step paired with whichever of the two text colours wins on it.
 * The pairing flips between step 600 and 700: 50–600 take deep ink,
 * 700–950 take soft white.
 */
export const SHADES = RAMP.map(([step, hex]) => {
  const onDark = contrast(hex, DEEP_INK)
  const onLight = contrast(hex, SOFT_WHITE)
  const useDark = onDark >= onLight
  const ratio = Math.max(onDark, onLight)

  return {
    step,
    hex,
    token: `aqua-${step}`,
    text: useDark ? DEEP_INK : SOFT_WHITE,
    textName: useDark ? 'deep ink' : 'soft white',
    ratio: `${ratio.toFixed(1)}:1`,
    ratioValue: ratio,
    level: level(ratio),
    isSeed: hex.toLowerCase() === SEED.toLowerCase(),
  }
})

/** Semantic roles — what each step is actually *for*. */
export const ROLES = [
  {
    name: 'Primary',
    step: '700',
    hex: '#347C81',
    use: 'Main actions, links, focused controls.',
  },
  {
    name: 'Primary Hover',
    step: '600',
    hex: '#419AA0',
    use: 'Hover / pressed state for primary.',
  },
  {
    name: 'Accent',
    step: '400',
    hex: '#7ECED3',
    use: 'Highlights, beta tags, brand seed.',
  },
  {
    name: 'Surface Tint',
    step: '50',
    hex: '#F2FBFB',
    use: 'Subtle section & card backgrounds.',
  },
  {
    name: 'Border',
    step: '200',
    hex: '#C5ECEE',
    use: 'Dividers, input outlines, chip fills.',
  },
  {
    name: 'Ink',
    step: '950',
    hex: '#123033',
    use: 'Headings & body text on light UI.',
  },
]

/** Lightest / darkest, surfaced on the seed card. */
export const LIGHTEST = RAMP[0][1]
export const DARKEST = RAMP[RAMP.length - 1][1]

/** Look a step up by name: step('700') → '#347C81'. */
export function step(name) {
  const found = RAMP.find(([s]) => s === String(name))
  return found ? found[1] : undefined
}
