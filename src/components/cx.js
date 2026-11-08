/**
 * Joins class names, dropping falsy entries so `cond && 'class'` is safe inline.
 *
 * Lives in lib/ rather than components/ui/ because every primitive needs it: if
 * it were exported from the ui barrel, each component importing it would pull
 * the whole barrel back in and make the module graph circular.
 */
export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}
