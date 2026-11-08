// node src/models/rules/refusal.check.js
import assert from 'node:assert/strict'
import { refusalText } from './refusal.js'

const err = (code, message, values) => Object.assign(new Error(message), { code, values })
assert.equal(refusalText('en', err('pick_active_role', 'x', { role: 'Account Member', role_ar: 'عضو الحسابات' })), 'Pick an active Account Member.')
assert.equal(refusalText('ar', err('pick_active_role', 'x', { role: 'Account Member', role_ar: 'عضو الحسابات' })), 'اختر عضو الحسابات نشطاً.')
assert.equal(refusalText('en', err('not_ready', 'x', { missing: ['details', 'session'] })), 'Not ready to transfer yet: Details, Session.')
assert.equal(refusalText('ar', err('not_ready', 'x', { missing: ['details', 'session'] })), 'غير جاهز للتحويل بعد: البيانات، الجلسة.')
assert.equal(refusalText('en', err('some_new_code', 'The server’s sentence.')), 'The server’s sentence.')
assert.equal(refusalText('ar', new Error('No code at all')), 'No code at all')
console.log('refusal.js ok')
