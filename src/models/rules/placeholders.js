/*
 * Settings → Emails & texts: which message each text belongs to, who it goes to, whether the Admin
 * may turn it off, and the {placeholders} it may use (the worker and the customer page fill exactly
 * these). A text using any other {word} is refused before it is saved. Each message's name is
 * admin.settings.texts.messages.<key> in the word files.
 */

import { translate } from '../../content/index.js'
import { ACTIVITY } from './activityTexts.js'
import { dayFor } from './format.js'

const CUSTOMER = ['name', 'company', 'product', 'app', 'date', 'time', 'meet_link', 'after_link', 'expires', 'support_phone', 'hours']
const TEAM = ['name', 'email', 'password', 'link', 'app', 'product', 'company']
const customer = { group: 'customer', placeholders: CUSTOMER, canTurnOff: true }

export const MESSAGES = {
  session_booked: customer,
  session_moved: customer,
  session_reminder: customer,
  session_missed: customer,
  session_cancelled: customer,
  follow_up: customer,
  feedback_reminder: customer,
  link_extended: customer,
  team_welcome: { group: 'team', placeholders: TEAM },
  team_reset: { group: 'team', placeholders: TEAM },
  team_email_changed: { group: 'team', placeholders: ['name', 'old_email', 'new_email', 'link', 'app', 'product', 'company'] },
  alert: { group: 'team', placeholders: ['name', 'text', 'link', 'app', 'product', 'company'] },
  after: { group: 'page', placeholders: ['name', 'company', 'expires', 'support_phone'] },
  calendar_title: { group: 'calendar', placeholders: ['product', 'customer', 'app', 'company'] },
}

// Alerts & activity: every log_*, alert_* and field_* line is its own message; it has no name of its own (its wording shows).
for (const [key, placeholders] of Object.entries(ACTIVITY)) MESSAGES[key] = { group: 'activity', placeholders }

/** The message a text key belongs to: "session_booked_subject" → "session_booked"; every after_* is the customer page. */
export const messageOf = (key) => (key.startsWith('after_') ? 'after' : key.replace(/_(subject|body)$/, ''))

/** The {words} in a text that its message can't fill. */
export const unknownPlaceholders = (text, allowed) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].filter((w) => !allowed.includes(w))

/**
 * Made-up values for the preview, in English or Arabic: the sample member's words from the content
 * files (admin.settings.texts.sample), the company's from Settings → Company, the session two days
 * from today at 10:00 and its link closing two days later.
 */
export function sampleValues(lang, { brand, company, reminderHours = [24] }) {
  const say = (k) => translate(lang, `admin.settings.texts.sample.${k}`)
  const site = company.app_url || 'https://…'
  const day = (ahead) => dayFor(lang, new Date(Date.now() + ahead * 864e5))
  return {
    name: say('name'),
    company: (lang === 'ar' && company.name_ar) || company.name || '',
    product: brand.product,
    app: brand.app,
    date: day(2),
    time: '10:00',
    meet_link: say('meetLink'),
    after_link: `${site}/after/…`,
    expires: `${day(4)} 10:00`,
    support_phone: company.support_phone || '…',
    hours: String(reminderHours[0] ?? 24),
    email: say('email'),
    password: say('password'),
    link: `${site}/login`,
    old_email: say('oldEmail'),
    new_email: say('email'),
    text: say('alert'),
    customer: say('customer'),
  }
}
