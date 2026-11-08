/**
 * The member form's draft (Add a member, and Edit on Member details). One object, so each
 * section gets `draft` and `set(patch)` instead of a dozen setters.
 */
export const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',               // starts with the Admin's country code (Settings → Timing → Phones)
  language: 'en',
  company: '',
  cr: '',
  vat: '',
  city: '',
  website: '',
  industry: null,
  size: null,
  plan: null,
  branches: '',
  users: '',
  features: {},
  integrations: [],
  files: {},
  hardware: {},
  due: {},
  slot: null,
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** value + onChange for one text field of the draft; `clean` tidies what was typed. */
export const bind = (draft, set, key, clean = (v) => v) => ({
  value: draft[key],
  onChange: (e) => set({ [key]: clean(e.target.value) }),
})

/** Tapping the picked chip again clears it. */
export const toggle = (current, key) => (current === key ? null : key)

/* The fields the member form edits, as the app names them; the server takes them snake_cased. */
export const FORM_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'language', 'company', 'cr', 'vat', 'city', 'website',
  'industry', 'size', 'plan', 'branches', 'users', 'features', 'integrations', 'hardware']

/** A member as the form's draft (the same keys Add a member uses). */
export const toDraft = (m) => ({
  ...Object.fromEntries(FORM_FIELDS.map((k) => [k, m[k] ?? ''])),
  files: m.files,
  due: m.due,
})
