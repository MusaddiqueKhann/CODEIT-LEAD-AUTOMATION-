import { useState } from 'react'
import { Button, cx, Field, Icon, Notice, SplashCard, TONES } from '@/components'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { PasswordInput } from './PasswordInput.jsx'

/**
 * The new password, twice. The length and "not your current password" rules live on the server
 * (Supabase Auth settings), which answers with a message this form shows.
 */
export function PasswordForm({ title, sub, onSave, onCancel }) {
  const { t, errorText } = useLang()
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const match = password !== '' && password === again

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSave(password)
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <SplashCard title={title} sub={sub}>
      <form id="password-form-label" onSubmit={submit} className="v-password-form__label mt-7 flex flex-col gap-4">
        <Notice role="alert">{error}</Notice>
        <Field id="password-form-label-2" label={t('signin.newPassword.label')}>
          {(props) => (
            <PasswordInput props={props} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </Field>
        <Field id="password-form-again" label={t('signin.newPassword.again')}>
          {(props) => (
            <PasswordInput props={props} autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
          )}
        </Field>
        <p className={cx('flex items-center gap-2 text-sm', match ? TONES.success.text : 'text-muted')}>
          <Icon name={match ? 'checkCircle' : 'info'} className="size-4" strokeWidth={1.9} />
          {match ? t('signin.newPassword.match') : t('signin.newPassword.typeTwice')}
        </p>
        <Button id="password-form-saving" type="submit" size="lg" fullWidth disabled={!match || busy}>
          {busy ? t('shared.common.saving') : t('signin.newPassword.saveContinue')}
        </Button>
        {onCancel && (
          <Button id="password-form-sign-out" variant="bare" onClick={onCancel} className="text-sm text-muted hover:text-ink">
            {t('shared.layout.signOut')}
          </Button>
        )}
      </form>
    </SplashCard>
  )
}
