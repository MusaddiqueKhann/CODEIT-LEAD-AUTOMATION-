/**
 * The status tone table: one source for every soft-filled status surface (badges, toasts, step
 * pills). Each pair is the design's own wash and text colour.
 */
export const TONES = {
  brand: { fill: 'bg-brand-100', text: 'text-brand-800', border: 'border-brand-200' },
  neutral: { fill: 'bg-surface', text: 'text-soft', border: 'border-line' },
  success: { fill: 'bg-success-bg', text: 'text-success-ink', border: 'border-success/35' },
  warn: { fill: 'bg-warn-bg', text: 'text-warn-ink', border: 'border-warn/35' },
  danger: { fill: 'bg-danger-bg', text: 'text-danger-ink', border: 'border-danger/35' },
  violet: { fill: 'bg-violet-bg', text: 'text-violet-ink', border: 'border-violet/30' },
  indigo: { fill: 'bg-indigo-bg', text: 'text-indigo-ink', border: 'border-indigo/30' },
}

/** Solid dots, for when colour is the only thing carrying the status. */
export const TONE_DOT = {
  brand: 'bg-brand-700',
  neutral: 'bg-faint',
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
  violet: 'bg-violet',
  indigo: 'bg-indigo',
}
