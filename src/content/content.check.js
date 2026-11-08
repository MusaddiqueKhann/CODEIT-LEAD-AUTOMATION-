// node src/lib/i18n.check.js
// The word files: both languages have the same keys and the same {placeholders}, every plural has
// its "other", and every key the code asks for with t('…') exists. (errors.* is Arabic only: the
// English is the server's own sentence.)
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { AREAS, translate } from './index.js'

const isPlural = (v) => v && typeof v === 'object' && 'other' in v
/** Every leaf as [path, text or plural object]. */
const leaves = (o, at = '') =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !isPlural(v) ? leaves(v, `${at}${k}.`) : [[`${at}${k}`, v]]))
const words = (v) => new Set([...(isPlural(v) ? Object.values(v).join(' ') : v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((w) => w !== 'n'))

for (const [area, { en, ar }] of Object.entries(AREAS)) {
  if (area === 'errors') continue
  const e = new Map(leaves(en))
  const a = new Map(leaves(ar))
  for (const k of e.keys()) assert.ok(a.has(k), `${area}.${k} has no Arabic`)
  for (const k of a.keys()) assert.ok(e.has(k), `${area}.${k} is only in Arabic`)
  for (const [k, v] of e) {
    assert.ok(typeof v === 'string' || isPlural(v), `${area}.${k} is a string or a plural`)
    assert.deepEqual([...words(a.get(k))].sort(), [...words(v)].sort(), `${area}.${k} uses the same {placeholders} in both`)
  }
}

// Every t('area.key') in the code is there.
const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : /\.jsx?$/.test(f) ? [join(dir, f)] : []))
const root = new URL('..', import.meta.url).pathname
let used = 0
for (const f of files(root)) {
  if (f.endsWith('.check.js') || f.includes('/content/')) continue
  for (const [, key] of readFileSync(f, 'utf8').matchAll(/\bt\('([a-z][\w]*\.[\w.]+)'/g)) {
    used++
    assert.ok(translate('en', key, { n: 1 }) !== null, `${f.replace(root, '')} asks for ${key}, which isn't in the word files`)
  }
}

assert.equal(translate('ar', 'common.ago.minutes', { n: 3 }), 'قبل 3 دقائق')
assert.equal(translate('ar', 'common.ago.minutes', { n: 2 }), 'قبل دقيقتين')
assert.equal(translate('en', 'common.ago.minutes', { n: 3 }), '3 min ago')
assert.equal(translate('ar', 'common.nothing.here'), null)
console.log(`i18n ok (${used} keys used in the code)`)
