// node src/lib/history.check.js
import assert from 'node:assert/strict'
import { describeChange as describe } from './history.js'
import { readFileSync } from 'node:fs'
import { CONTENT, translate } from '../../content/index.js'

const describeChange = (row) => describe(row, (k, v) => translate('en', k, v))

assert.deepEqual(describeChange({ area: 'settings', item: 'buffer_days', before: 3, after: 5 }), { what: 'Buffer before a session', change: '3 → 5 working days' })
assert.deepEqual(describeChange({ area: 'settings', item: 'reminder_hours', before: [24, 1], after: [24] }), { what: 'Session reminders', change: '24, 1 → 24 hours before' })
assert.deepEqual(describeChange({ area: 'settings', item: 'email_key', before: 'set', after: 'replaced' }), { what: 'email service key', change: 'replaced' })
assert.equal(describeChange({ area: 'settings', item: 'company', before: { name: 'A', app_name: 'X' }, after: { name: 'A', app_name: 'Y' } }).change, 'app name changed')
assert.equal(describeChange({ area: 'option', item: 'lost_reason/price', before: null, after: { label: 'Price' } }).change, 'added')
assert.equal(describeChange({ area: 'option', item: 'lost_reason/price', before: { label: 'Price', active: true }, after: { label: 'Price', active: false } }).change, 'turned off')
assert.equal(describeChange({ area: 'option', item: 'step/sales', before: { label: 'Sales', sort: 1 }, after: { label: 'Selling', sort: 1 } }).change, 'renamed from Sales')
assert.equal(describeChange({ area: 'option', item: 'size/1-10', before: { label: 'x', sort: 1 }, after: { label: 'x', sort: 2 } }).change, 'moved')
assert.equal(describeChange({ area: 'text', item: 'after_send', before: { en: 'Send', ar: 'إرسال' }, after: { en: 'Send now', ar: 'إرسال' } }).change, 'English changed')
assert.equal(describeChange({ area: 'holiday', item: '2030-02-22', before: null, after: 'Founding Day' }).change, 'added: Founding Day')
assert.equal(describeChange({ area: 'holiday', item: '2030-02-22', before: 'Founding Day', after: null }).change, 'removed: Founding Day')
const ar = (row) => describe(row, (k, v) => translate('ar', k, v), 'ar')
assert.deepEqual(ar({ area: 'settings', item: 'buffer_days', before: 3, after: 5 }), { what: 'المهلة قبل الجلسة', change: '3 → 5 أيام عمل' })
assert.equal(ar({ area: 'option', item: 'lost_reason/price', before: null, after: { label: 'Price', label_ar: 'السعر' } }).what, 'سبب الخسارة: السعر')
// Every setting the log can name has words: a Timing tile's name, or one under history.names.
const schema = readFileSync(new URL('../../../supabase/migrations/0001_schema.sql', import.meta.url), 'utf8')
const columns = [...schema.match(/create table public\.settings \(([\s\S]*?)\n\);/)[1].matchAll(/^\s+([a-z_]+)\s+[a-z]/gm)].map((m) => m[1])
const { history, timing } = CONTENT.en.admin.settings
for (const c of columns.filter((c) => !['id', 'updated_at', 'updated_by'].includes(c))) assert.ok(timing.fields[c] || history.names[c], `the setting ${c} has a name for History`)
for (const list of Object.keys(CONTENT.en.admin.settings.lists.names)) assert.ok(history.lists[list], `the list ${list} has a name for History`)
console.log('history.js ok')
