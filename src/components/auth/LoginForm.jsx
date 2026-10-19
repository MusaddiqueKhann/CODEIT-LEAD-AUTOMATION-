import { useState } from 'react'
import Icon from '../Icon.jsx'
import { Button, Card, Checkbox, Field, Input } from '../ui/index.js'

/**
 * The glass sign-in card.
 *
 * Owns the form draft (email, password, show/hide) and swaps to the success
 * tick once `succeeded`; the page owns the session and the redirect, so this
 * only hands the submit event up through `onSubmit`.
 */
export function LoginForm({ succeeded, onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Card
      radius="rounded-[28px]"
      padding="none"
      surface="border-white/40 bg-canvas/95"
      className="w-full max-w-md p-8 shadow-2xl backdrop-blur-xl sm:p-10"
    >
      {succeeded ? (
        <div className="flex flex-col items-center py-8 text-center">
          {/* Solid green disc + white check — the classic success tick. */}
          <div className="flex size-16 items-center justify-center rounded-full bg-success text-white ring-8 ring-success/10">
            <Icon name="check" className="size-8" strokeWidth={3} />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold text-ink">
            Sign in successful
          </h2>
          <p className="mt-1.5 text-sm text-muted">Taking you to your dashboard…</p>
        </div>
      ) : (
        <>
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
            <Field label="Email">
              {(props) => (
                <Input
                  {...props}
                  icon="mail"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              )}
            </Field>

            <Field
              label="Password"
              action={
                <Button
                  variant="bare"
                  className="text-xs font-semibold text-brand-700 transition hover:text-brand-800"
                >
                  Forgot password?
                </Button>
              }
            >
              {(props) => (
                <Input
                  {...props}
                  icon="shield"
                  className="pr-16"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  trailing={
                    <Button
                      variant="bare"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted transition hover:text-ink"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  }
                />
              )}
            </Field>

            <Checkbox className="mt-1">Keep me signed in</Checkbox>

            <Button type="submit" size="lg" fullWidth className="mt-2">
              Sign in
            </Button>
          </form>
        </>
      )}
    </Card>
  )
}
