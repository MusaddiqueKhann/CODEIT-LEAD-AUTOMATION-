import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SplashCard } from '../../components/layout/SplashCard.jsx'
import { Button, Field, FormError, Input } from '../../components/ui/index.js'
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
    <Link to={PUBLIC.login} className="text-sm font-medium text-brand-700 hover:text-brand-800">
      {t('auth.backToSignIn')}
    </Link>
  )

  if (sent) {
    return (
      // The email is one left-to-right piece, so it doesn't scramble inside Arabic.
      <SplashCard title={t('auth.forgot.checkTitle')} sub={t('auth.forgot.checkSub', { email: `\u2066${email.trim()}\u2069` })}>
        <div className="mt-6">{back}</div>
      </SplashCard>
    )
  }

  return (
    <SplashCard title={t('auth.forgot.title')} sub={t('auth.forgot.sub')}>
      <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
        <FormError>{error}</FormError>
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
        <Button type="submit" size="lg" fullWidth disabled={busy}>
          {busy ? t('auth.forgot.sending') : t('auth.forgot.send')}
        </Button>
        <div className="text-center">{back}</div>
      </form>
    </SplashCard>
  )
}
