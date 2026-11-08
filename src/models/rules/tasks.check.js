// node src/lib/tasks.check.js
import assert from 'node:assert/strict'
import { translate } from '../../content/index.js'
import { taskOf } from './tasks.js'

const labelOf = (list, k) => ({ hala: 'Hala', surepay: 'Surepay' })[k] ?? k
const ctx = { labelOf, setupKeys: ['branches', 'products', 'staff', 'attends'], product: 'CODEIT', t: (k, v) => translate('en', k, v) }
const base = { outcome: null, holderId: 'me', integrations: [], ready: {}, noShows: 0, session: null }

assert.equal(taskOf({ ...base, stage: 'collecting', holderId: 'sara' }, 'me', ctx), null) // not with me
assert.equal(taskOf({ ...base, stage: 'collecting', outcome: 'lost' }, 'me', ctx), null)
assert.equal(
  taskOf({ ...base, stage: 'collecting', ready: { details: true, requirements: true, account: true, hardware: true, session: true }, transferDeadline: '2030-01-09' }, 'me', ctx).todo,
  'Still needed: documents',
)
assert.equal(taskOf({ ...base, stage: 'collecting', sentBackReason: 'Hala form is wrong' }, 'me', ctx).todo, 'Sent back: Hala form is wrong')
assert.equal(taskOf({ ...base, stage: 'collecting', noShows: 1 }, 'me', ctx).todo, 'Missed the session. Book a new time')
assert.equal(taskOf({ ...base, stage: 'collecting', noShows: 1 }, 'me', ctx).at, 'pick-time') // lands on Pick a time
assert.equal(taskOf({ ...base, stage: 'collecting' }, 'me', ctx).at, 'ready') // lands on the Ready card
const account = taskOf({ ...base, stage: 'collecting', holderId: 'faris', accountPersonId: 'me', transferDeadline: '2030-01-09' }, 'me', ctx)
assert.deepEqual([account.step, account.todo, account.due], ['setup', 'Create the CODEIT account', '2030-01-09'])
assert.equal(taskOf({ ...base, stage: 'collecting', ready: { details: true, requirements: true, documents: true, hardware: true, session: true } }, 'me', ctx).todo, 'Still needed: the CODEIT account')
assert.equal(
  taskOf({ ...base, stage: 'integration', integrations: ['surepay', 'hala'], integrationChecks: { surepay: { connected: true, tested: true } } }, 'me', ctx).todo,
  'Connect and test Hala',
)
assert.equal(taskOf({ ...base, stage: 'setup', setupChecks: { branches: true } }, 'me', ctx).todo, 'Setup checklist · 1 of 4 done')
// The same task in Arabic.
const ar = { ...ctx, labelOf: (list, k) => ({ hala: 'هلا', surepay: 'Surepay' })[k] ?? k, t: (k, v) => translate('ar', k, v) }
assert.equal(
  taskOf({ ...base, stage: 'collecting', ready: { details: true, requirements: true, hardware: true, session: true } }, 'me', ar).todo,
  'ما زال مطلوباً: المستندات، حساب CODEIT',
)
assert.equal(taskOf({ ...base, stage: 'integration', integrations: ['surepay', 'hala'] }, 'me', ar).todo, 'اربط واختبر Surepay، هلا')
console.log('tasks.js ok')
