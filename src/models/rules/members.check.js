// Self-check for the documents and readiness maths: `node src/lib/members.check.js`
import assert from 'node:assert/strict'
import { byReadiness, docState, docsFor, extOf, integrationDocs, featuresFor, fileSize, freeAt, inDaysLabel, loadOf, nobodyLabel, readiness, readyOf } from './members.js'
import { atStep, stepState, statusOf, tabOfAction } from './stages.js'
import { translate } from '../../content/index.js'

// The same shape useConfig() loads from the options table.
const opt = (key, meta = {}) => ({ key, label: key, active: true, meta })
const documents = [
  opt('logo'), opt('cr', { integrations: ['surepay'] }), opt('vat'),
  opt('basicItems', { plans: ['basic'] }),
  opt('menu', { plans: ['restaurant'] }),
  opt('products', { plans: ['retail', 'restaurant'] }),
  opt('surepay', { plans: [], integrations: ['surepay'] }),
  opt('hala', { plans: [], integrations: ['hala'] }),
]
const features = [
  opt('loyalty', { plans: ['retail', 'restaurant'] }),
  opt('waiter', { plans: ['restaurant'] }),
]
const choices = [opt('d7', { days: 7 })].map((c) => ({ ...c, label: '1 week' }))

assert.deepEqual(docsFor(documents, null, ['surepay']), [])
assert.deepEqual(docsFor(documents, 'basic'), ['logo', 'cr', 'vat', 'basicItems'])
assert.deepEqual(docsFor(documents, 'restaurant'), ['logo', 'cr', 'vat', 'menu', 'products'])
assert.deepEqual(docsFor(documents, 'retail', ['surepay', 'deliverect']), ['logo', 'cr', 'vat', 'products', 'surepay']) // Deliverect has no form
const retail = docsFor(documents, 'retail', ['surepay', 'hala'])
assert.deepEqual(integrationDocs(documents, 'surepay', retail), ['cr', 'surepay'], 'SurePay lists its form and the CR it also uses')
assert.deepEqual(integrationDocs(documents, 'hala', retail), ['hala'])
assert.deepEqual(integrationDocs(documents, 'deliverect', retail), [], 'no documents for Deliverect')

assert.deepEqual(featuresFor(features, 'basic'), [])
assert.deepEqual(featuresFor(features, 'restaurant'), ['loyalty', 'waiter'])

const keys = ['logo', 'cr', 'vat', 'products']
const state = docState({ logo: { name: 'logo.png' } }, { cr: 3, vat: 14, logo: 7 }, keys)
assert.deepEqual(state, { logo: true, cr: 3, vat: 14, products: undefined }) // an uploaded file beats its due date
assert.deepEqual(readiness(state, keys), { done: 1, pending: 2, unmarked: 1, total: 4, latest: 14 })
assert.equal(readiness({ logo: true }, ['logo']).latest, null)
assert.deepEqual(['products', 'vat', 'logo', 'cr'].sort(byReadiness(state)), ['cr', 'vat', 'products', 'logo']) // soonest due, no date, uploaded
assert.equal(extOf('CR_certificate.pdf'), 'PDF')

assert.equal(inDaysLabel(choices, 7), '1 week')
assert.equal(inDaysLabel(choices, 10), '10 days')
assert.equal(fileSize(245760), '240 KB')
assert.equal(fileSize(3 * 1048576), '3.0 MB')

assert.ok(atStep({ stage: 'collecting', accountCreatedAt: null }, 'setup'))
assert.ok(!atStep({ stage: 'collecting', accountCreatedAt: '2030-01-01' }, 'setup'))
assert.ok(atStep({ stage: 'session' }, 'onboarding'))
assert.equal(statusOf({ stage: 'integration', outcome: 'lost' }), 'lost')

assert.deepEqual(readyOf({ ready: { details: true, account: false, session: true, ok: false } }), { done: 2, total: 3 })
assert.deepEqual(readyOf({}), { done: 0, total: 0 })
assert.equal(nobodyLabel({ stage: 'recording' }), 'Customer')
assert.equal(nobodyLabel({ stage: 'setup' }), 'Nobody picked')
const arabic = (k, v) => translate('ar', k, v)
assert.equal(nobodyLabel({ stage: 'recording' }, arabic), 'العميل')
assert.equal(inDaysLabel(choices, 10, arabic), '10 أيام')
assert.equal(inDaysLabel(choices, 1, arabic), 'يوم واحد')

// A member's steps: Sales and Setup run together; a Lost member has no current step.
const fresh = { stage: 'collecting', accountCreatedAt: null }
assert.deepEqual(['sales', 'setup', 'integration'].map((k) => stepState(fresh, k)), ['now', 'now', 'todo'])
assert.equal(stepState({ stage: 'session', accountCreatedAt: 'x' }, 'integration'), 'done')
assert.equal(stepState({ stage: 'closed', accountCreatedAt: 'x' }, 'closed'), 'done')
assert.equal(stepState({ stage: 'integration', accountCreatedAt: 'x', outcome: 'lost' }, 'integration'), 'todo')
// Buttons land on their own step's tab; Send back follows where the member is.
assert.equal(tabOfAction('transfer', fresh), 'sales')
assert.equal(tabOfAction('send_back', { stage: 'integration' }), 'integration')
assert.equal(tabOfAction('send_back', { stage: 'session' }), 'onboarding')
assert.equal(tabOfAction('cancel', fresh), undefined)

// Who is free for a new session: hours, leave, the gap round other sessions, and being full.
const office = Array.from({ length: 7 }, (_, i) => ({ on: i < 5, from: '09:00', to: '17:00' }))
const rules = { officeHours: office, sessionMinutes: 30, gapMinutes: 10, maxOpenMembers: 2 }
const sara = { id: 's', role: 'onboarding', active: true, mustChangePassword: false, hours: null }
const mona = { id: 'm', role: 'onboarding', active: true, mustChangePassword: false, hours: null }
const tue = new Date(2030, 0, 8) // a Tuesday
const at = (h, min = 0) => new Date(2030, 0, 8, h, min)
const booked = { people: { onboarding: 's' }, stage: 'session', session: { date: tue, time: '10:00' } }
const world = { people: [sara, mona], members: [booked], leave: [], holidays: [], settings: rules }
const names = (list) => list.map((p) => p.id).join()
assert.equal(names(freeAt(at(10, 30), world)), 'm', 'a session at 10:00 plus the 10-minute gap blocks 10:30')
assert.equal(names(freeAt(at(10, 40), world)), 's,m', 'free again once the gap has passed')
assert.equal(names(freeAt(at(16, 40), world)), '', 'a session must end inside the hours')
assert.equal(names(freeAt(at(11), { ...world, leave: [{ personId: 'm', startsOn: '2030-01-08', endsOn: '2030-01-09' }] })), 's', 'leave takes them out')
assert.equal(names(freeAt(at(11), { ...world, holidays: [{ day: '2030-01-08' }] })), '', 'nobody on a holiday')
assert.equal(names(freeAt(new Date(2030, 0, 11, 11), world)), '', 'nobody on a day off')
const full = { ...world, members: [booked, { ...booked, session: null, stage: 'setup' }] }
assert.equal(loadOf(full.members, sara), 2)
assert.equal(names(freeAt(at(14), full)), 'm', 'someone full gets nothing new')

console.log('members.js ok')
