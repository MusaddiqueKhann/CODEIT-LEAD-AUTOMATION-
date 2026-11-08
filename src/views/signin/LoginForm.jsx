import { useState } from 'react'
import { signInWithGoogle, takeGoogleError } from '../../models/data/auth.js'
import { Link } from 'react-router-dom'
import { SplashCard } from '../../components/layout/SplashCard.jsx'
import Icon from '../../components/Icon.jsx'
import { Button, Field, FormError, Input } from '../../components/ui/index.js'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { PUBLIC } from '../../routes/paths.js'
import { PasswordInput } from './PasswordInput.jsx'

/**
 * The sign-in card: "Sign in with Google" first, then email and password for anyone without a
 * Google account. Owns the draft and the error; `onSignIn(email, password)` does the work and
 * throws a readable message when it fails. On success the gate moves the person on, so the tick
 * shows only for a moment. A refused Google sign-in comes back here with its reason.
 */
export function LoginForm({ onSignIn, notice }) {
  const { t, errorText } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // A Google sign-in that was refused says why, once.
  const [error, setError] = useState(() => {
    const err = takeGoogleError()
    return err && errorText(err)
  })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const google = async () => {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSignIn(email, password)
      setDone(true)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <SplashCard title={t('auth.signedIn')} sub={t('auth.opening')}>
        <div className="mt-6 flex justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success text-white ring-8 ring-success/10">
            <Icon name="check" className="size-8" strokeWidth={3} />
          </span>
        </div>
      </SplashCard>
    )
  }

  return (
    <SplashCard title={t('auth.welcomeBack')} sub={t('auth.welcomeSub')}>
      <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
        <FormError tone="warn">{notice}</FormError>
        <FormError>{error}</FormError>
        <Button type="button" variant="outline" size="lg" fullWidth onClick={google} disabled={busy} className="gap-2.5">
          <img src="/google.svg" alt="" className="size-4.5" />
          {t('auth.google')}
        </Button>
        <span className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-edge" />
          {t('auth.orEmail')}
          <span className="h-px flex-1 bg-edge" />
        </span>
        <Field label={t('auth.email')}>
          {(props) => (
            <Input
              {...props}
              icon="mail"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              placeholder="you@codeit.sa"
            />
          )}
        </Field>
        <Field
          label={t('auth.password')}
          action={
            <Link to={PUBLIC.forgot} className="text-xs font-medium text-brand-700 transition hover:text-brand-800">
              {t('auth.forgotLink')}
            </Link>
          }
        >
          {(props) => (
            <PasswordInput
              props={props}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          )}
        </Field>
        <Button type="submit" size="lg" fullWidth className="mt-2" disabled={busy}>
          {busy ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>
    </SplashCard>
  )
}
