// node src/lib/settingsExamples.check.js
import assert from 'node:assert/strict'
import { fromDay } from './format.js'
import { translate } from '../../content/index.js'
import { exampleFor } from './settingsExamples.js'

const week = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ on: d < 5, from: '09:00', to: '17:00' }))
const ctx = { today: fromDay('2026-11-05'), now: new Date(2026, 10, 5, 10, 0), officeHours: week, holidays: new Set(), t: (k, v) => translate('en', k, v) } // a Thursday
const v = { buffer_days: 3, files_ready_days: 2, session_minutes: 30, gap_minutes: 10, slot_step_minutes: 30, integration_due_days: 2,
  reminder_hours: [24, 1], low_rating_max: 3, phone_prefix: '+966 ', phone_min_digits: 9, lock_tries: 5 }

assert.equal(exampleFor('buffer_days', v, ctx), 'Sales can book from Tue 10 Nov') // Thu + 3 working days skips Fri, Sat
assert.equal(exampleFor('files_ready_days', v, ctx), 'Files in today → first session Mon 09 Nov')
assert.equal(exampleFor('gap_minutes', v, ctx), 'The same person’s next session starts from 10:40')
assert.equal(exampleFor('slot_step_minutes', v, ctx), 'Start times 09:00, 09:30, 10:00…')
assert.equal(exampleFor('integration_due_days', v, ctx), 'Session Thu 12 Nov → integrations done by Tue 10 Nov')
assert.equal(exampleFor('reminder_hours', v, ctx), 'Emails 24 h and 1 h before the session')
assert.equal(exampleFor('low_rating_max', v, ctx), '1 to 3 stars tell the Admin')
assert.equal(exampleFor('phone_min_digits', v, ctx), '+966 55 123 4567 has 12 digits')
assert.equal(exampleFor('lock_tries', v, ctx), '5 wrong passwords in a row locks the account')
assert.equal(exampleFor('buffer_days', { ...v, buffer_days: NaN }, ctx), '') // half-typed: no line
assert.equal(exampleFor('feedback_reminder_hours', { ...v, feedback_reminder_hours: 24 }, ctx), 'Sent at 10:00 → reminder at 10:00 the next day')
assert.equal(exampleFor('session_hours', { ...v, session_hours: 12 }, ctx), 'Signed in at 09:00 → asked again at 21:00')
assert.equal(exampleFor('feedback_reminder_hours', { ...v, feedback_reminder_hours: 72 }, ctx), 'Sent at 10:00 → reminder at 10:00 3 days later')
const ar = { ...ctx, t: (k, v) => translate('ar', k, v) }
assert.equal(exampleFor('lock_tries', v, ar), '5 كلمات مرور خاطئة متتالية تقفل الحساب')
assert.equal(exampleFor('lock_tries', { ...v, lock_tries: 2 }, ar), 'كلمتا مرور خاطئتان متتاليتان تقفلان الحساب')
assert.equal(exampleFor('lock_tries', { ...v, lock_tries: 1 }, ctx), '1 wrong password in a row locks the account')
assert.equal(exampleFor('reminder_hours', v, ar), 'رسائل قبل الجلسة بـ 24 ساعة و1 ساعة')
console.log('settingsExamples.js ok')
