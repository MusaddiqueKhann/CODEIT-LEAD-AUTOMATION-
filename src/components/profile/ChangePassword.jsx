import { useState } from 'react'
import { Button, Card, Field, Input } from '../ui/index.js'
import { useToast } from '../../context/ToastContext.jsx'

/**
 * The change-password form. Three fields, three local checks, and a toast in
 * place of a server round-trip.
 */
export function ChangePassword() {
  const { toast } = useToast()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [touched, setTouched] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  /* The three checks the fixture can actually make without a server: something
     entered for the current one, a new one long enough to matter, and a
     confirmation that agrees with it. */
  const currentError = touched && !form.current ? 'Enter your current password.' : null
  const nextError = touched && form.next.length < 8 ? 'Use at least 8 characters.' : null
  const confirmError =
    touched && form.confirm !== form.next ? 'The two passwords don’t match.' : null

  const valid = form.current && form.next.length >= 8 && form.confirm === form.next
  const filled = form.current || form.next || form.confirm

  const reset = () => {
    setForm({ current: '', next: '', confirm: '' })
    setTouched(false)
  }

  const save = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    reset()
    toast('This is a prototype — your password wasn’t changed.', 'warn')
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
        <Field label="Current password" required error={currentError} className="sm:col-span-2">
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="current-password"
              value={form.current}
              onChange={set('current')}
              error={currentError}
            />
          )}
        </Field>

        <Field label="New password" required error={nextError} hint="At least 8 characters.">
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="new-password"
              value={form.next}
              onChange={set('next')}
              error={nextError}
            />
          )}
        </Field>

        <Field label="Confirm new password" required error={confirmError}>
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={set('confirm')}
              error={confirmError}
            />
          )}
        </Field>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
        <Button type="submit" icon="shield" disabled={!valid}>
          Update password
        </Button>
        {filled && (
          <Button variant="ghost" onClick={reset}>
            Clear
          </Button>
        )}
      </div>
    </Card>
  )
}
