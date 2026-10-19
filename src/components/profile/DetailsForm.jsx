import { useState } from 'react'
import { Button, Card, Field, Input } from '../ui/index.js'
import { useToast } from '../../context/ToastContext.jsx'
import { user } from '../../data/mockData.js'

/** Whether the value looks like an address at all — not whether it exists. */
function isEmailish(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * The personal-details form: name, email, phone, with save/discard.
 *
 * Owns its own draft and validation; the prototype has no server, so "save"
 * only reports through the toast stack.
 */
export function DetailsForm() {
  const { toast } = useToast()
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
  })
  const [touched, setTouched] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const emailError = touched && !isEmailish(form.email) ? 'That doesn’t look like an email address.' : null
  const firstNameError = touched && !form.firstName.trim() ? 'A first name is required.' : null
  const lastNameError = touched && !form.lastName.trim() ? 'A last name is required.' : null

  /* Compared against the fixture rather than tracked with a dirty flag — the
     form has four fields and no autosave, so deriving it cannot go stale. */
  const changed =
    form.firstName !== user.firstName ||
    form.lastName !== user.lastName ||
    form.email !== user.email ||
    form.phone !== user.phone

  const save = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!form.firstName.trim() || !form.lastName.trim() || !isEmailish(form.email)) return
    toast('This is a prototype — changes aren’t saved to a server.', 'warn')
  }

  return (
    <Card
      as="form"
      padding="lg"
      surface="border-transparent bg-panel"
      className="shadow-sm"
      onSubmit={save}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" required error={firstNameError}>
          {(props) => (
            <Input {...props} value={form.firstName} onChange={set('firstName')} error={firstNameError} />
          )}
        </Field>

        <Field label="Last name" required error={lastNameError}>
          {(props) => (
            <Input {...props} value={form.lastName} onChange={set('lastName')} error={lastNameError} />
          )}
        </Field>

        <Field label="Email" required error={emailError} hint="Session reminders go here.">
          {(props) => (
            <Input
              {...props}
              type="email"
              value={form.email}
              onChange={set('email')}
              error={emailError}
            />
          )}
        </Field>

        <Field label="Phone">
          {(props) => <Input {...props} type="tel" value={form.phone} onChange={set('phone')} />}
        </Field>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
        <Button type="submit" icon="check" disabled={!changed}>
          Save changes
        </Button>
        {changed && (
          <Button
            variant="ghost"
            onClick={() => {
              setForm({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
              })
              setTouched(false)
            }}
          >
            Discard
          </Button>
        )}
      </div>
    </Card>
  )
}
