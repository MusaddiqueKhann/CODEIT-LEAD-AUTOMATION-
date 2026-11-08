// node src/lib/placeholders.check.js
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fill } from './format.js'
import { translate } from '../../content/index.js'
import { MESSAGES, messageOf, sampleValues, unknownPlaceholders } from './placeholders.js'

assert.equal(messageOf('session_booked_subject'), 'session_booked')
assert.equal(messageOf('after_closed_body'), 'after')
assert.equal(messageOf('calendar_title'), 'calendar_title')
assert.deepEqual(unknownPlaceholders('Hello {name}, {nmae} and {name}', ['name']), ['nmae'])
assert.deepEqual(unknownPlaceholders('No braces', ['name']), [])

// Every placeholder the default wording uses is one its message can fill.
const sql = readFileSync(new URL('../../../supabase/migrations/0007_defaults.sql', import.meta.url), 'utf8')
const texts = [...sql.matchAll(/\('([a-z_]+)',\s*(?:E?'((?:[^']|'')*)'),\s*(?:E?'((?:[^']|'')*)')\)/g)]
assert.ok(texts.length > 30, `found ${texts.length} default texts`)
for (const [, key, en, ar] of texts) {
  const m = MESSAGES[messageOf(key)]
  assert.ok(m, `${key} belongs to a known message`)
  assert.deepEqual(unknownPlaceholders(en + ar, m.placeholders), [], `${key} uses only its placeholders`)
}

// The preview fills every placeholder of every message it previews (alerts and activity lines have none).
const v = sampleValues('ar', { brand: { app: 'Lead Codeit', product: 'CODEIT' }, company: { name: 'CODEIT', name_ar: 'كوديت' } })
const previewed = Object.entries(MESSAGES).filter(([, m]) => m.group !== 'activity')
for (const [, m] of previewed) for (const p of m.placeholders) assert.ok(v[p] !== undefined, `sample for {${p}}`)
assert.equal(fill('{company} · {product}', v), 'كوديت · CODEIT')
// Every message has a name in both languages (an alert or activity line is named by its own wording).
for (const [key] of previewed) {
  assert.ok(translate('en', `admin.settings.texts.messages.${key}`), `${key} has an English name`)
  assert.ok(translate('ar', `admin.settings.texts.messages.${key}`) !== translate('en', `admin.settings.texts.messages.${key}`), `${key} has an Arabic name`)
}
assert.equal(translate('ar', 'admin.settings.texts.messages.session_missed'), 'عدم الحضور · «افتقدناك»')
assert.equal(messageOf('log_transferred'), 'log_transferred')
assert.ok(MESSAGES.alert_given.placeholders.includes('role'), 'alerts are in the catalogue with their placeholders')
console.log('placeholders.js ok')
