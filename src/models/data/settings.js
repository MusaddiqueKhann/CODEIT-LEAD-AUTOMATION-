import { camelKeys } from './case.js'
import { fromServer } from '../rules/format.js'
import { supabase } from './client.js'
import { avatarUrl } from './auth.js'
import { rows } from './rows.js'
import { toError } from './errors.js'

/**
 * Everything the app reads once after sign-in: the settings row, every options list, the texts,
 * holidays, the team and the leave this person may see. Nothing in the code holds these values.
 *
 * `lists` is { [list]: [{ key, label, labelAr, active, meta }] } in the Admin's order, including
 * options that were turned off (old members still show them; pickers filter on `active`).
 */
export async function loadConfig() {
  const [[settings], options, texts, holidays, team, leave] = await Promise.all([
    rows(supabase.from('settings').select('*')),
    rows(supabase.from('options').select('list, key, label, label_ar, active, sort, meta').order('sort')),
    rows(supabase.from('texts').select('key, en, ar')),
    rows(supabase.from('holidays').select('day, name').order('day')),
    rows(supabase.from('profiles').select('id, name, email, role, active, avatar_path').order('name')),
    rows(supabase.from('leave').select('person_id, starts_on, ends_on').order('starts_on')),
  ])

  // Every table comes back empty when the server no longer accepts this sign-in (it ended, or
  // passed the time-box in Settings). Say so, so the app can sign out instead of breaking.
  if (!settings) {
    const ended = new Error('Your sign-in has ended. Please sign in again.')
    ended.sessionEnded = true
    throw ended
  }

  const lists = {}
  for (const o of options) (lists[o.list] ??= []).push(camelKeys(o))

  return {
    settings: camelKeys(settings),
    lists,
    texts: Object.fromEntries(texts.map((t) => [t.key, t])),
    holidays,
    team: team.map((p) => ({ ...camelKeys(p), avatarUrl: avatarUrl(p.avatar_path) })),
    leave: leave.map(camelKeys),
    loadedAt: Date.now(),
  }
}

/** Admin: Settings → History, newest first: who changed which setting, list, text or holiday, and how. */
export async function listSettingsLog() {
  const log = await rows(supabase.from('settings_log').select('id, actor_id, area, item, before, after, at').order('at', { ascending: false }).limit(200))
  return log.map((r) => ({ ...camelKeys(r), at: fromServer(r.at) }))
}

/** The brand words in Settings → Company: { app, product, legal }, the legal name in Arabic when there is one. */
export const brandOf = (company = {}, lang = 'en') => ({
  app: company.app_name ?? '',
  product: company.product_name ?? '',
  legal: (lang === 'ar' && company.legal_name_ar) || company.legal_name || '',
})

let brand
/** The brand words for pages before sign-in, asked once per visit; empty words if the server can't say. */
export const loadBrand = () => (brand ??= call('brand').then((b) => b ?? {}, () => ({})))

async function call(fn, args) {
  const { error, data } = await supabase.rpc(fn, args)
  if (error) throw toError(error)
  return data
}

/** Admin: change some settings (snake_case keys, as the settings table names them). */
export const updateSettings = (patch) => call('update_settings', { p: patch })
/** Admin: whether the email service key is set (the key itself never comes back). */
export const emailKeySet = () => call('email_key_set')
/** Admin: save the email service key into Vault, or remove it with ''. */
export const setEmailKey = (key) => call('set_email_key', { p_key: key })
/** Admin: add or rename a public holiday; returns how many sessions already fall on it. */
export const setHoliday = (day, name) => call('set_holiday', { p_day: day, p_name: name })
export const removeHoliday = (day) => call('remove_holiday', { p_day: day })
/** Admin: add or change one option of a list. */
export const saveOption = (list, o) =>
  call('save_option', { p_list: list, p_key: o.key, p_label: o.label, p_label_ar: o.labelAr ?? null, p_active: o.active, p_sort: o.sort, p_meta: o.meta })
/** Admin: the English and Arabic wording of one text. */
export const saveText = (key, en, ar) => call('save_text', { p_key: key, p_en: en, p_ar: ar })
/** Admin: one email, as saved, filled with a made-up member, to your own address ("en" or "ar"). */
export const sendTestEmail = (template, lang) => call('send_test_email', { p_template: template, p_lang: lang })
