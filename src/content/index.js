/*
 * The app's words in English and Arabic. Each area of the app has its own file in ./words with both
 * languages side by side ({ en: {...}, ar: {...} }), so the two never drift apart. A key reads
 * "area.name" (t('settings.save')). An entry may be plural: { one, other } in English and
 * { zero, one, two, few, many, other } in Arabic, picked by `n`. Missing Arabic falls back to English.
 */
import actions from './words/actions.js'
import alerts from './words/alerts.js'
import auth from './words/auth.js'
import calendar from './words/calendar.js'
import common from './words/common.js'
import errors from './words/errors.js'
import layout from './words/layout.js'
import member from './words/member.js'
import members from './words/members.js'
import overview from './words/overview.js'
import person from './words/person.js'
import settings from './words/settings.js'
import shared from './words/shared.js'
import tasks from './words/tasks.js'
import team from './words/team.js'

export const AREAS = { actions, alerts, auth, calendar, common, errors, layout, member, members, overview, person, settings, shared, tasks, team }
const DICTS = Object.fromEntries(['en', 'ar'].map((lang) => [lang, Object.fromEntries(Object.entries(AREAS).map(([area, words]) => [area, words[lang] ?? {}]))]))

const lookup = (dict, key) => key.split('.').reduce((o, k) => o?.[k], dict)
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (m, k) => (values[k] ?? m))
const rules = { en: new Intl.PluralRules('en'), ar: new Intl.PluralRules('ar') }

/** The Arabic of something the server saved in both languages when reading Arabic and it has one, else the English. */
export const pick = (lang, en, ar) => (lang === 'ar' && ar ? ar : en)

/** The words for `key` in `lang` ("en" or "ar"), with {placeholders} filled; null when there are none. */
export function translate(lang, key, values = {}) {
  const pick = (l) => {
    let entry = lookup(DICTS[l], key)
    if (entry && typeof entry === 'object') entry = entry[rules[l].select(values.n ?? 0)] ?? entry.other
    return typeof entry === 'string' ? entry : null
  }
  const text = pick(lang) ?? pick('en')
  return text == null ? null : fill(text, values)
}
