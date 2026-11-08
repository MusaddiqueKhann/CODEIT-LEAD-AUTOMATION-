// Self-check for the time and slot maths: `node src/lib/time.check.js`
// Run it again as `TZ=America/New_York node src/lib/time.check.js`: Riyadh time must not follow the machine.
import assert from 'node:assert/strict'
import { ago, dayKey, fill, formatFor, fromDay, fromServer, riyadhNow, toServer } from './format.js'
import { addDays, addWorkingDays, daySlots, hourSpan, initials, openDays, workdayHours, workingDaysUntil } from './time.js'

const now = new Date()
assert.equal(riyadhNow().getHours(), (now.getUTCHours() + 3) % 24)
assert.equal(riyadhNow().getMinutes(), now.getUTCMinutes())

// Server timestamps read as Riyadh wall-clock time, and go back with the +03:00 offset.
const at = fromServer('2026-11-05T08:30:00Z')
assert.deepEqual([at.getDate(), at.getHours(), at.getMinutes()], [5, 11, 30])
assert.equal(fromServer('2026-11-05T23:30:00+00:00').getDate(), 6) // 02:30 the next day in Riyadh
assert.equal(toServer(fromDay('2026-11-05'), '11:30'), '2026-11-05T11:30:00+03:00')
assert.equal(dayKey(fromDay('2026-02-28')), '2026-02-28') // a date-only column never shifts a day

const day = { on: true, from: '09:00', to: '10:30' }
assert.deepEqual(daySlots(day, 30, 40), ['09:00', '09:40']) // 10:20 would end past 10:30
assert.deepEqual(daySlots(day, 30, 30), ['09:00', '09:30', '10:00'])
assert.deepEqual(daySlots({ ...day, on: false }, 30, 30), [])
assert.deepEqual(daySlots({ ...day, from: '12:00' }, 30, 30), []) // from after to

const allOff = Array(7).fill({ on: false, from: '09:00', to: '17:00' })
assert.deepEqual(openDays(allOff, 5, 14), []) // terminates
assert.equal(openDays(allOff.map(() => day), 5, 3).length, 3) // capped by the window
assert.deepEqual(hourSpan([{ on: true, from: '07:30', to: '18:15' }]), [7, 19])
assert.equal(addDays(fromDay('2026-02-27'), 2).getDate(), 1)
assert.equal(workdayHours([{ on: true, from: '09:00', to: '17:00' }, { on: true, from: '09:00', to: '14:00' }, { on: false, from: '09:00', to: '17:00' }]), 6.5)
assert.equal(workdayHours(allOff), 0)

// Working days: Sun–Thu open, Fri and Sat off (Sunday first, like getDay).
const week = [1, 1, 1, 1, 1, 0, 0].map((on) => ({ on: !!on, from: '09:00', to: '17:00' }))
const wed = fromDay('2030-01-02')
assert.equal(workingDaysUntil(wed, fromDay('2030-01-06'), week), 2) // Thu, then Sun
assert.equal(workingDaysUntil(wed, fromDay('2030-01-06'), week, new Set(['2030-01-03'])), 1) // Thu is a holiday
assert.equal(workingDaysUntil(wed, wed, week), 0)
assert.equal(dayKey(addWorkingDays(wed, 1, week)), '2030-01-03') // Thu
assert.equal(dayKey(addWorkingDays(fromDay('2030-01-03'), 1, week)), '2030-01-06') // Thu → Sun, past the weekend
assert.equal(dayKey(addWorkingDays(wed, 1, week, new Set(['2030-01-03']))), '2030-01-06') // Thu is a holiday
assert.equal(workingDaysUntil(fromDay('2030-01-06'), wed, week), -2) // two working days ago

assert.equal(initials('Faisal Al-Harbi'), 'FH')

// The customer's page: placeholders, and Riyadh time in either language.
assert.equal(fill('Hi {name}, call {phone}. {x}', { name: 'Noura', phone: '920' }), 'Hi Noura, call 920. {x}')
assert.match(formatFor('en', '2030-01-03T11:00:00Z'), /Thursday.*3 January.*14:00/)
assert.match(formatFor('ar', '2030-01-03T11:00:00Z'), /الخميس.*14:00/)

const noon = new Date(2030, 0, 2, 12, 0)
assert.equal(ago(new Date(2030, 0, 2, 11, 48), noon), '12 min ago')
assert.equal(ago(new Date(2030, 0, 2, 9, 0), noon), '3 h ago')
assert.equal(ago(new Date(2030, 0, 1, 23, 0), noon), 'Yesterday')
assert.equal(ago(new Date(2029, 11, 30, 9, 0), noon), 'Sun 30 Dec')

// The files-ready rule: Thu files + 2 working days skips Fri and Sat (the week below is Sun–Thu).
{
  const week = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ on: d < 5, from: '09:00', to: '17:00' }))
  assert.equal(dayKey(addWorkingDays(fromDay('2026-11-05'), 2, week)), '2026-11-09')
  assert.equal(dayKey(addWorkingDays(fromDay('2026-11-05'), 0, week)), '2026-11-05')
  assert.equal(dayKey(addWorkingDays(fromDay('2026-11-05'), 1, week, new Set(['2026-11-08']))), '2026-11-09')
  assert.equal(dayKey(addWorkingDays(fromDay('2026-11-08'), -1, week)), '2026-11-05') // 1 working day before Sun is Thu
  addWorkingDays(fromDay('2026-11-05'), 3, allOff) // a week with no working day still returns
}
console.log('time.js ok')
