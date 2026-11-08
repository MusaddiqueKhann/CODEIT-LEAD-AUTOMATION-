import { camelKeys } from './case.js'
import { supabase } from './client.js'
import { toError } from './errors.js'

/*
 * The customer's page. Both calls work without signing in: the link's token is the key, and the
 * server gives back only this page's fields.
 */

/**
 * { found, language, name, recordingLink, expiresAt, closed, rated, company, supportPhone, texts },
 * in the member's language, or in `lang` ("en" / "ar") when the customer picked one.
 */
export async function getAfter(token, lang = null) {
  const { data, error } = await supabase.rpc('after_get', { p_token: token, p_lang: lang })
  if (error) throw toError(error)
  const page = camelKeys(data)
  // A text or phone the Admin left empty shows as nothing rather than breaking the page.
  return { ...page, texts: page.texts ?? {}, supportPhone: page.supportPhone ?? '', company: page.company ?? '' }
}

/** Saves 1 to 5 stars and an optional comment, once, while the link is open. */
export async function rateAfter(token, stars, comment) {
  const { error } = await supabase.rpc('after_rate', { p_token: token, p_stars: stars, p_comment: comment })
  if (error) throw toError(error)
}
