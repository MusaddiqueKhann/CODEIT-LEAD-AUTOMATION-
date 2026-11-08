/**
 * A Supabase error as an Error the screens can say in the reader's language: `message` is the
 * server's English sentence, `code` the short name it sent as a hint (or "not_allowed" for any
 * refusal of permission), and `values` what the sentence names (sent as JSON in the details).
 */
export function toError(error) {
  const err = new Error(error.message)
  err.code = error.hint || (error.code === '42501' ? 'not_allowed' : null)
  try {
    err.values = error.details ? JSON.parse(error.details) : {}
  } catch {
    err.values = {}
  }
  return err
}

/** An error this app makes itself: an English sentence and the code its Arabic is kept under. */
export function appError(code, message, values = {}) {
  const err = new Error(message)
  err.code = code
  err.values = values
  return err
}
