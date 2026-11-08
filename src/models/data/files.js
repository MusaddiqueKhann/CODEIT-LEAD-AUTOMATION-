import { supabase } from './client.js'
import { appError, toError } from './errors.js'

const BUCKET = 'documents'

/**
 * Uploads a document to <member>/<kind>/<random>.<ext> and records it. The stored name is
 * random, so Arabic file names work; the real name is kept on the record. The file it replaces
 * is deleted afterwards.
 */
export async function uploadDocument(memberId, kind, file, replacedPath) {
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin'
  const path = `${memberId}/${kind}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined })
  if (error) throw appError('file_upload', `Couldn’t upload ${file.name}: ${error.message}`, { file: file.name })
  const { error: attachError } = await supabase.rpc('attach_document', {
    p_member: memberId, p_kind: kind, p_path: path, p_name: file.name, p_size: file.size,
  })
  if (attachError) throw toError(attachError)
  if (replacedPath && replacedPath !== path) await supabase.storage.from(BUCKET).remove([replacedPath])
}

/** Forgets a member's file (the server checks and logs it), then deletes the stored object. */
export async function removeDocument(memberId, kind) {
  const { data: path, error } = await supabase.rpc('remove_document', { p_member: memberId, p_kind: kind })
  if (error) throw toError(error)
  if (path) await supabase.storage.from(BUCKET).remove([path])
}

/**
 * A short-lived link to look at a stored file, or null when it isn't there (the sample data has
 * none). With `download` (a file name) the link saves the file under that name instead.
 */
export async function fileUrl(path, download) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300, download ? { download } : undefined)
  return error ? null : data.signedUrl
}

