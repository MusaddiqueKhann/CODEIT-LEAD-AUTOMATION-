// node src/content/content.check.js
// The words: the same files and keys in both languages (Arabic may carry more plural forms), the
// same {placeholders}, and every key the code, the sidebar and the server's refusals ask for exists.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { COMPANY_PARTS, NAV, SECTIONS } from '../routes/paths.js'
import { CONTENT, isPlural, translate } from './index.js'

const FORMS = { en: ['one', 'other'], ar: ['zero', 'one', 'two', 'few', 'many', 'other'] }

const leaves = (o, at = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !isPlural(v) ? leaves(v, `${at}${k}.`) : [[`${at}${k}`, v]]))
const holes = (v) => [...new Set([...(isPlural(v) ? Object.values(v).join(' ') : v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((w) => w !== 'n'))].sort()
const lookup = (dict, key) => key.split('.').reduce((o, k) => o?.[k], dict)

// ── Both languages have the same words ─────────────────────────────────────
assert.deepEqual(Object.keys(CONTENT.ar), Object.keys(CONTENT.en), 'the same files in both languages')
const en = new Map(leaves(CONTENT.en))
const ar = new Map(leaves(CONTENT.ar))
for (const k of en.keys()) assert.ok(ar.has(k), `${k} has no Arabic`)
for (const [k, a] of ar) {
  assert.ok(en.has(k), `${k} has no English`)
  const e = en.get(k)
  for (const [lang, v] of [['en', e], ['ar', a]]) {
    assert.ok(typeof v === 'string' || isPlural(v), `${k} (${lang}) is words or a plural`)
    if (isPlural(v)) assert.ok(Object.keys(v).every((f) => FORMS[lang].includes(f)), `${k} (${lang}) uses only its language's plural forms`)
  }
  assert.equal(isPlural(a), isPlural(e), `${k} is a plural in both languages or in neither`)
  assert.deepEqual(holes(a), holes(e), `${k} uses the same {placeholders} in both`)
}

// ── Every key the code asks for is there ───────────────────────────────────
// A quoted key must be words or a group; a template's fixed head (`admin.settings.lists.names.${k}`) a group.
const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : /\.jsx?$/.test(f) ? [join(dir, f)] : []))
const root = new URL('..', import.meta.url).pathname
const KEY = new RegExp(`(['"\`])((?:${Object.keys(CONTENT.en).join('|')})\\.(?:[A-Za-z][\\w.]*?)?)(\\$\\{|\\1)`, 'g')
// Every t(…) / translate(lang, …) key starts with a content file's name (an old key would slip past the scan above).
const CALL = /(?:\bt\(|\btranslate\([^,()]+,\s*)[`'"]([a-zA-Z]\w*)[.$]/g
let used = 0
for (const f of files(root)) {
  if (f.includes('/content/')) continue
  for (const [, head] of readFileSync(f, 'utf8').matchAll(CALL)) assert.ok(head in CONTENT.en, `${f.replace(root, '')} asks for a key under "${head}", which isn't a content file`)
  for (const [, , key, end] of readFileSync(f, 'utf8').matchAll(KEY)) {
    used++
    const at = `${f.replace(root, '')} asks for ${key}`
    if (end === '${') {
      const head = key.slice(0, key.lastIndexOf('.'))
      const group = lookup(CONTENT.en, head) ?? lookup(CONTENT.ar, head)
      assert.ok(group && typeof group === 'object' && !isPlural(group), `${at}…, which isn't a group in the word files`)
    } else {
      const path = key.replace(/\.$/, '')
      assert.ok(lookup(CONTENT.en, path) ?? lookup(CONTENT.ar, path), `${at}, which isn't in the word files`)
    }
  }
}
// The settings Save bars name their words by prefix.
for (const bar of ['shared.settings.bar', 'admin.settings.companyBar']) {
  for (const k of ['unsaved', 'allSaved', 'nothing', 'unsavedSub', 'savedSub', 'nothingSub']) assert.ok(translate('en', `${bar}.${k}`), `${bar}.${k}`)
}
for (const { key } of NAV) assert.ok(translate('en', `shared.layout.nav.${key}`), `the sidebar's ${key} has a name`)
for (const { key } of SECTIONS) assert.ok(translate('en', `shared.layout.sections.${key}`), `the sidebar group ${key} has a name`)
for (const part of COMPANY_PARTS) assert.ok(translate('en', `admin.settings.sections.${part}.title`), `Company settings → ${part} has a name`)

// ── Every refusal the server or the app can send has its words ───────────────────────
const repo = new URL('../../', import.meta.url).pathname
const inside = (dir, ext) => readdirSync(join(repo, dir), { recursive: true }).filter((f) => f.endsWith(ext)).map((f) => readFileSync(join(repo, dir, f), 'utf8'))
const codes = new Set()
const find = (texts, re) => texts.forEach((s) => [...s.matchAll(re)].forEach(([, c]) => codes.add(c)))
find(inside('supabase/migrations', '.sql'), /hint\s*=\s*'([a-z_]+)'/g)
find(inside('supabase/functions', '.ts'), /refuse\('([a-z_]+)'/g)
find(inside('src', '.js'), /appError\('([a-z_]+)'/g)
find(inside('src', '.jsx'), /appError\('([a-z_]+)'/g)
for (const c of codes) for (const lang of ['en', 'ar']) assert.equal(typeof lookup(CONTENT[lang], `shared.errors.${c}`), 'string', `the refusal ${c} has words in ${lang}`)

assert.equal(translate('ar', 'shared.common.ago.minutes', { n: 3 }), 'قبل 3 دقائق')
assert.equal(translate('ar', 'shared.common.ago.minutes', { n: 2 }), 'قبل دقيقتين')
assert.equal(translate('en', 'shared.common.ago.minutes', { n: 3 }), '3 min ago')
assert.equal(translate('ar', 'shared.common.nothing.here'), null)
console.log(`content ok (${used} keys used in the code, ${codes.size} server refusals)`)
