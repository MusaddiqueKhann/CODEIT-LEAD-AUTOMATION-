/*
 * The app's words: one JSON file per portal in en/ and ar/, with the same keys in both. A key reads
 * "<file>.<path>" (t('admin.team.title')): shared.json holds what every portal uses, and each portal
 * file (signin, admin, sales, account, integration, onboarding) holds its own screens. An entry may
 * be plural: an object whose keys are only plural forms ({ one, other } in English; zero, one, two,
 * few, many, other in Arabic), picked by `n`. Missing Arabic falls back to English. The customer
 * page's words are the Admin's (Company settings → Texts), so they live in the database.
 */
import arAccount from './ar/account.json' with { type: 'json' }
import arAdmin from './ar/admin.json' with { type: 'json' }
import arIntegration from './ar/integration.json' with { type: 'json' }
import arOnboarding from './ar/onboarding.json' with { type: 'json' }
import arSales from './ar/sales.json' with { type: 'json' }
import arShared from './ar/shared.json' with { type: 'json' }
import arSignin from './ar/signin.json' with { type: 'json' }
import enAccount from './en/account.json' with { type: 'json' }
import enAdmin from './en/admin.json' with { type: 'json' }
import enIntegration from './en/integration.json' with { type: 'json' }
import enOnboarding from './en/onboarding.json' with { type: 'json' }
import enSales from './en/sales.json' with { type: 'json' }
import enShared from './en/shared.json' with { type: 'json' }
import enSignin from './en/signin.json' with { type: 'json' }

export const CONTENT = {
  en: { shared: enShared, signin: enSignin, admin: enAdmin, sales: enSales, account: enAccount, integration: enIntegration, onboarding: enOnboarding },
  ar: { shared: arShared, signin: arSignin, admin: arAdmin, sales: arSales, account: arAccount, integration: arIntegration, onboarding: arOnboarding },
}

const FORMS = new Set(['zero', 'one', 'two', 'few', 'many', 'other'])
/** A plural: an object whose keys are only plural forms, with "other" among them. */
export const isPlural = (v) => !!v && typeof v === 'object' && 'other' in v && Object.keys(v).every((f) => FORMS.has(f))

const lookup = (dict, key) => key.split('.').reduce((o, k) => o?.[k], dict)
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (m, k) => (values[k] ?? m))
const rules = { en: new Intl.PluralRules('en'), ar: new Intl.PluralRules('ar') }

/** The Arabic of something the server saved in both languages when reading Arabic and it has one, else the English. */
export const pick = (lang, en, ar) => (lang === 'ar' && ar ? ar : en)

/** The words for `key` in `lang` ("en" or "ar"), with {placeholders} filled; null when there are none. */
export function translate(lang, key, values = {}) {
  const words = (l) => {
    let entry = lookup(CONTENT[l], key)
    if (isPlural(entry)) entry = entry[rules[l].select(values.n ?? 0)] ?? entry.other
    return typeof entry === 'string' ? entry : null
  }
  const text = words(lang) ?? words('en')
  return text == null ? null : fill(text, values)
}
