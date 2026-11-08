import { toError } from './errors.js'
import { supabase } from './client.js'
/** Awaits a Supabase query and returns its rows, throwing its error instead of returning it. */
export async function rows(query) {
  const { data, error } = await query
  if (error) throw toError(error)
  return data
}

/** Calls a database function; throws its refusal as an Error the screens can say in either language. */
export async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw toError(error)
  return data
}
