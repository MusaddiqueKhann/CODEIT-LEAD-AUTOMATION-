import { toError } from './errors.js'
/** Awaits a Supabase query and returns its rows, throwing its error instead of returning it. */
export async function rows(query) {
  const { data, error } = await query
  if (error) throw toError(error)
  return data
}
