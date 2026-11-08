import { translate } from '../../content/index.js'
import { formatShort, fromDay } from './format.js'

/**
 * A refusal (an Error with a `code`) in `lang`: its words by code (shared.errors.*), with what it
 * names filled in: a list of parts by their names, a day as a date, and, reading Arabic, the
 * "<name>_ar" value the server sent for <name>. The error's own sentence when there are no words.
 */
export function refusalText(lang, err) {
  if (!err?.code) return err?.message ?? String(err)
  const sent = err.values ?? {}
  const show = (v) =>
    Array.isArray(v)
      ? v.map((x) => translate(lang, `shared.errors.names.${x}`) ?? x).join(translate(lang, 'shared.common.listJoin'))
      : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
        ? formatShort(fromDay(v))
        : String(v)
  const values = Object.fromEntries(Object.entries(sent).map(([k, v]) => [k, show(lang === 'ar' && sent[`${k}_ar`] ? sent[`${k}_ar`] : v)]))
  return translate(lang, `shared.errors.${err.code}`, values) ?? err.message
}
