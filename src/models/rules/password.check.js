// node src/models/rules/password.check.js
import assert from 'node:assert/strict'
import { MIN_PASSWORD, newPassword } from './password.js'

const SHAPE = /^[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9][!@#$%&][A-HJ-NP-Za-km-z2-9]{2}-[A-HJ-NP-Za-km-z2-9]{4}$/
const made = Array.from({ length: 200 }, newPassword)
for (const p of made) assert.match(p, SHAPE, `${p} has the server's shape`)
assert.ok(made[0].length >= MIN_PASSWORD)
assert.ok(new Set(made).size > 195, 'each one is different')
console.log('password.js ok')
