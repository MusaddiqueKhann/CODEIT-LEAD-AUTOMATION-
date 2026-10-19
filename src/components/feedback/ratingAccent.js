/* Rating colour reads as sentiment: a 1 is a bad-red, climbing through amber
   to green, and a top 5 lands on the brand teal. Every lit star takes the
   colour of the current value, so the whole row shifts as the pointer moves. */
export const RATING_ACCENT = {
  1: { text: 'text-danger', box: 'border-danger/40 bg-danger/10' },
  2: { text: 'text-danger', box: 'border-danger/40 bg-danger/10' },
  3: { text: 'text-warn', box: 'border-warn/40 bg-warn/10' },
  4: { text: 'text-success', box: 'border-success/40 bg-success/10' },
  5: { text: 'text-brand-700', box: 'border-brand-700/40 bg-brand-700/10' },
}
