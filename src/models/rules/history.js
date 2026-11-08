import { messageOf } from './placeholders.js'

/*
 * Settings → History: one change (a settings_log row) in words. `area` is settings, option, text
 * or holiday; `item` the setting, "list/key", text key or day; `before` and `after` what it was
 * and became (null when added or removed). `t` gives the words (settings.history.*) and `lang`
 * which name of an option to show.
 */

const words = (key) => key.replaceAll('_', ' ')
const show = (v) => (Array.isArray(v) ? v.join(', ') : v === null || v === undefined || v === '' ? '—' : typeof v === 'object' ? '…' : String(v))
/** The keys of two objects whose values differ. */
const changedKeys = (a = {}, b = {}) => [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])].filter((k) => JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k]))

/** { what, change }: what changed, and how, e.g. { what: 'buffer days', change: '3 → 5' }. */
export function describeChange({ area, item, before, after }, t, lang = 'en') {
  const say = (k, values) => t(`settings.history.${k}`, values)
  /** A word from a group of names (settings.history.<group>.<key>), or the key in words when there is none. */
  const named = (group, key) => {
    const w = say(`${group}.${key}`)
    return !w || w === `settings.history.${group}.${key}` ? words(key) : w
  }
  const fields = (keys) => keys.map((k) => named('fields', k)).join(', ')
  /** A Timing setting's name as on its tile ("Buffer before a session"), or null for other settings. */
  const tile = (k) => {
    const w = t(`settings.timing.fields.${k}`)
    return !w || w === `settings.timing.fields.${k}` ? null : w
  }
  const nameOf = (o) => (lang === 'ar' && o?.label_ar) || o?.label

  if (area === 'holiday') {
    return {
      what: say('holiday', { item }),
      change: before == null ? say('holidayAdded', { name: after }) : after == null ? say('holidayRemoved', { name: before }) : `${before} → ${after}`,
    }
  }
  if (area === 'text') {
    const langs = changedKeys(before, after).map((k) => say(`langs.${k}`)).join(say('and'))
    const message = lang === 'ar' ? t(`settings.texts.messages.${messageOf(item)}`) : words(item)
    return { what: say('text', { item: message }), change: say('changed', { fields: langs }) }
  }
  if (area === 'option') {
    const [list, key] = item.split('/')
    const what = say('option', { list: named('lists', list), name: nameOf(after) ?? nameOf(before) ?? key })
    if (before == null) return { what, change: say('added') }
    const keys = changedKeys(before, after).filter((k) => k !== 'sort')
    if (keys.length === 0) return { what, change: say('moved') }
    if (keys.length === 1 && keys[0] === 'active') return { what, change: say(after.active ? 'turnedOn' : 'turnedOff') }
    if (keys.includes('label')) return { what, change: say('renamed', { name: nameOf(before) }) }
    return { what, change: say('changed', { fields: fields(keys) }) }
  }
  if (item === 'email_key') return { what: named('names', item), change: say(`emailKey.${after}`) }
  if (before && typeof before === 'object' && !Array.isArray(before)) {
    return { what: named('names', item), change: say('changed', { fields: fields(changedKeys(before, after)) }) }
  }
  const unit = tile(item) && t(`settings.timing.units.${item}`)
  return { what: tile(item) ?? named('names', item), change: `${show(before)} → ${show(after)}${unit ? ` ${unit}` : ''}` }
}
