import { useState } from 'react'
import { signInWithGoogle, takeGoogleError } from '../../controllers/signin.js'
import { Link } from 'react-router-dom'
import { Button, Field, Icon, Input, Notice, SplashCard } from '@/components'
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
      <SplashCard title={t('signin.signedIn')} sub={t('signin.opening')}>
        <div className="mt-6 flex justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success text-white ring-8 ring-success/10">
            <Icon name="check" className="size-8" strokeWidth={3} />
          </span>
        </div>
      </SplashCard>
    )
  }

  return (
    <SplashCard title={t('signin.welcomeBack')} sub={t('signin.welcomeSub')}>
      <form id="login-form-google" onSubmit={submit} className="v-login-form__google mt-7 flex flex-col gap-4">
        <Notice tone="warn" role="alert">{notice && errorText(notice)}</Notice>
        <Notice role="alert">{error}</Notice>
        <Button id="login-form-google-2" type="button" variant="outline" size="lg" fullWidth onClick={google} disabled={busy} className="gap-2.5">
          <img src="/google.svg" alt="" className="size-4.5" />
          {t('signin.google')}
        </Button>
        <span className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-edge" />
          {t('signin.orEmail')}
          <span className="h-px flex-1 bg-edge" />
        </span>
        <Field id="login-form-email" label={t('signin.email')}>
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
              placeholder={t('signin.emailHint')}
            />
          )}
        </Field>
        <Field id="login-form-password"
          label={t('signin.password')}
          action={
            <Link id="login-form-forgot-link" to={PUBLIC.forgot} className="v-login-form__forgot-link text-xs font-medium text-brand-700 transition hover:text-brand-800">
              {t('signin.forgotLink')}
            </Link>
          }
        >
          {(props) => (
            <PasswordInput
              props={props}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('signin.passwordHint')}
            />
          )}
        </Field>
        <Button id="login-form-signing-in" type="submit" size="lg" fullWidth className="mt-2" disabled={busy}>
          {busy ? t('signin.signingIn') : t('signin.signIn')}
        </Button>
      </form>
    </SplashCard>
  )
}
