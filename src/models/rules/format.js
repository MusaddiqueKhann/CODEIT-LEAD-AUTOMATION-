import { translate } from '../../content/index.js'

/*
 * Dates read in the app's language. The app sets it once per render (setDateLanguage), so every
 * formatter here follows the reader; Arabic stays Gregorian with digits 0–9. The Dates are Riyadh
 * wall-clock times (see riyadhNow), so they are formatted without a time zone.
 */
let LANG = 'en'
const LOCALE = { en: 'en-GB', ar: 'ar-SA-u-ca-gregory-nu-latn' }
export const setDateLanguage = (lang) => {
  LANG = lang === 'ar' ? 'ar' : 'en'
}
const format = (date, options) => new Intl.DateTimeFormat(LOCALE[LANG], options).format(date)
const SUNDAY = new Date(2026, 0, 4) // any Sunday

/** The seven day names, Sunday first like Date#getDay: "Sun"… or, with 'long', "Sunday"…, in the app's language. */
export const weekdayNames = (style = 'short') =>
  Array.from({ length: 7 }, (_, i) => format(new Date(2026, 0, SUNDAY.getDate() + i), { weekday: style }))

/** "1 session", "3 sessions" (English only: screens in both languages use t() with a plural entry). */
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

/** Fills {word} placeholders from `values`; an unknown one stays as it is. */
export const fill = (text, values) => text.replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m)

/**
 * A moment as a customer reads it, in their language and Riyadh time: "Thursday 5 November, 14:00".
 * Arabic stays Gregorian with Latin digits, the same as the customer emails.
 */
export const formatFor = (language, iso) =>
  new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    timeZone: 'Asia/Riyadh',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))

/** "Mon 20 Jul" (Arabic: "الاثنين، 20 يوليو") */
export function formatShort(date) {
  return LANG === 'ar'
    ? format(date, { weekday: 'long', day: 'numeric', month: 'long' })
    : `${weekdayShort(date)} ${String(date.getDate()).padStart(2, '0')} ${monthShort(date)}`
}

/** "Monday, 20 July 2026" — the dateline under a page title. */
export function formatLong(date) {
  return format(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Now in Riyadh, as a Date whose local getters (getHours, getDay…) read Riyadh
 * wall-clock time whatever the browser's own time zone. Every screen does its
 * date maths on these, so a team member abroad still sees Riyadh times.
 * ponytail: fixed UTC+3; Saudi Arabia has no daylight saving.
 */
export function riyadhNow() {
  return riyadhAt(Date.now())
}

/** A moment (ms since epoch) as the same kind of Riyadh wall-clock Date. */
function riyadhAt(ms) {
  const w = new Date(ms + 3 * 36e5)
  return new Date(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate(), w.getUTCHours(), w.getUTCMinutes(), w.getUTCSeconds())
}

/** A server timestamp (ISO, any offset) as a Riyadh wall-clock Date, like riyadhNow. */
export const fromServer = (iso) => riyadhAt(Date.parse(iso))

const pad = (n) => String(n).padStart(2, '0')

/** "Tue 03 Nov · 14:05" — a moment in a log or a list. */
export const formatStamp = (d) => `${formatShort(d)} · ${formatTime(d)}`
/** "14:20" */
export const formatTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/** How long ago a Riyadh wall-clock Date was: "just now", "12 min ago", "3 h ago", "Yesterday", else "Mon 20 Jul". */
export function ago(d, now = riyadhNow()) {
  const min = Math.floor((now - d) / 6e4)
  if (min < 1) return translate(LANG, 'common.ago.now')
  if (min < 60) return translate(LANG, 'common.ago.minutes', { n: min })
  if (isSameDay(d, now)) return translate(LANG, 'common.ago.hours', { n: Math.floor(min / 60) })
  if (isSameDay(d, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return translate(LANG, 'common.ago.yesterday')
  return formatShort(d)
}

/** "2026-11-05" for a Riyadh wall-clock Date. */
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** A Riyadh day plus "HH:MM" as a timestamp the server reads correctly, wherever the browser is. */
export const toServer = (date, time) => `${dayKey(date)}T${time}:00+03:00`

/** A date-only column ("2026-11-05") as a local Date. Never `new Date('2026-11-05')`, which is UTC midnight. */
export const fromDay = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** "Mon" — the day-picker chips stack the weekday over the date number. */
export function weekdayShort(date) {
  return format(date, { weekday: 'short' })
}

/** "Jul" (US English for the short month: British English writes September as "Sept"). */
export function monthShort(date) {
  return LANG === 'ar' ? format(date, { month: 'short' }) : new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
}

/** "July 2026" — the calendar's month heading, where the year has to be visible. */
export function monthYear(date) {
  return format(date, { month: 'long', year: 'numeric' })
}

/**
 * Same calendar day, ignoring time.
 *
 * Compared through startOfDay rather than by toDateString() or by pulling the
 * three fields apart at each call site — a booking's Date carries no time
 * component today, but nothing enforces that, and `a - b === 0` on raw Dates
 * would start returning false the moment one does.
 */
export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}
