import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Field, Input, Notice, SplashCard } from '@/components'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { PUBLIC } from '../../routes/paths.js'

/** Asks for an email and sends the reset link. The answer is the same whether or not the email is on the team. */
export function ForgotForm({ onSend }) {
  const { t, errorText } = useLang()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSend(email)
      setSent(true)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const back = (
    <Link id="forgot-form-back-to-sign-in" to={PUBLIC.login} className="v-forgot-form__back-to-sign-in text-sm font-medium text-brand-700 hover:text-brand-800">
      {t('signin.backToSignIn')}
    </Link>
  )

  if (sent) {
    return (
      // The email is one left-to-right piece, so it doesn't scramble inside Arabic.
      <SplashCard title={t('signin.forgot.checkTitle')} sub={t('signin.forgot.checkSub', { email: `\u2066${email.trim()}\u2069` })}>
        <div className="mt-6">{back}</div>
      </SplashCard>
    )
  }

  return (
    <SplashCard title={t('signin.forgot.title')} sub={t('signin.forgot.sub')}>
      <form id="forgot-form-email" onSubmit={submit} className="v-forgot-form__email mt-7 flex flex-col gap-4">
        <Notice role="alert">{error}</Notice>
        <Field id="forgot-form-email-2" label={t('signin.email')}>
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
        <Button id="forgot-form-sending" type="submit" size="lg" fullWidth disabled={busy}>
          {busy ? t('signin.forgot.sending') : t('signin.forgot.send')}
        </Button>
        <div className="text-center">{back}</div>
      </form>
    </SplashCard>
  )
}
