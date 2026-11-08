import { formatShort, formatStamp } from './format.js'
import { addDays, addWorkingDays, toMinutes, toTime } from './time.js'

/*
 * Settings → Timing: under each setting, what it means today, so the Admin sees the rule at work
 * ("Sales can book from Tue 10 Nov"). `v` is every value on the form (numbers, lists as arrays, the
 * phone prefix as text); `today` a Date at midnight, `now` a Date; `officeHours` and `holidays`
 * (a Set of "YYYY-MM-DD") as the working-day maths needs them; `t` gives the words
 * (admin.settings.examples.*) in the reader's language. A value that isn't a number yet gives no line.
 */
export function exampleFor(key, v, { today, now, officeHours, holidays, t }) {
  const n = v[key]
  if (typeof n === 'number' && !Number.isFinite(n)) return ''
  const say = (k, values) => t(`admin.settings.examples.${k}`, values)
  const work = (d, k) => addWorkingDays(d, k, officeHours, holidays)
  const session = work(today, 5) // a session a week out, for the deadlines
  // A clock time `h` hours after midnight today: "14:00", "10:00 the next day", "10:00 2 days later".
  const at = (h) => {
    const time = toTime((h % 24) * 60)
    return h < 24 ? time : h < 48 ? say('atNextDay', { time }) : say('atDaysLater', { time, days: Math.floor(h / 24) })
  }
  const hours = (list, join) => list.map((h) => say('hours', { n: h })).join(join)

  switch (key) {
    case 'buffer_days':
    case 'files_ready_days':
      return say(key, { date: formatShort(work(today, n)) })
    case 'session_minutes':
      return say(key, { time: toTime(600 + n) })
    case 'gap_minutes':
      return say(key, { time: toTime(600 + v.session_minutes + n) })
    case 'slot_step_minutes':
      return n > 0 ? say(key, { times: [0, 1, 2].map((i) => toTime(toMinutes('09:00') + i * n)).join(t('shared.common.listJoin')) }) : ''
    case 'book_ahead_days':
    case 'due_soon_days':
    case 'ahead_days':
      return say(key, { date: formatShort(addDays(today, n)) })
    case 'recent_days':
    case 'alerts_keep_days':
      return say(key, { date: formatShort(addDays(today, -n)) })
    case 'integration_due_days':
    case 'setup_due_days':
      return say(key, { session: formatShort(session), date: formatShort(work(session, -n)) })
    case 'max_upload_mb':
    case 'max_open_members':
    case 'no_show_limit':
    case 'lock_tries':
    case 'lock_window_minutes':
    case 'lock_minutes':
      return say(key, { n })
    case 'link_hours':
      return say(key, { stamp: formatStamp(new Date(+now + n * 36e5)) })
    case 'feedback_reminder_hours':
      return say(key, { at: at(10 + n) })
    case 'recording_alert_hours':
      return say(key, { at: at(11 + n) })
    case 'session_hours':
      return say(key, { at: at(9 + n) })
    case 'reminder_hours':
      return n.length ? say(key, { list: hours(n, t('shared.common.and')) }) : say('noReminders')
    case 'extend_hours':
      return n.length ? say(key, { list: hours(n, say('or')) }) : say('noExtend')
    case 'low_rating_max':
      return n >= 1 ? (n === 1 ? say('lowRatingOne') : say(key, { max: n })) : ''
    case 'phone_min_digits':
      return say(key, { phone: [v.phone_prefix.trim(), '55 123 4567'].filter(Boolean).join(' '), digits: (v.phone_prefix + '551234567').replace(/\D/g, '').length })
    case 'phone_prefix':
      return n.trim() ? say(key, { prefix: n.trim() }) : say('noPrefix')
    default:
      return ''
  }
}
