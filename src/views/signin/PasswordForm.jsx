import { useState } from 'react'
import { SplashCard } from '../../components/layout/SplashCard.jsx'
import Icon from '../../components/Icon.jsx'
import { Button, Field, FormError } from '../../components/ui/index.js'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { cx } from '../../components/cx.js'
import { TONES } from '../../components/tones.js'
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
      <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
        <FormError>{error}</FormError>
        <Field label={t('auth.newPassword.label')}>
          {(props) => (
            <PasswordInput props={props} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </Field>
        <Field label={t('auth.newPassword.again')}>
          {(props) => (
            <PasswordInput props={props} autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
          )}
        </Field>
        <p className={cx('flex items-center gap-2 text-sm', match ? TONES.success.text : 'text-muted')}>
          <Icon name={match ? 'checkCircle' : 'info'} className="size-4" strokeWidth={1.9} />
          {match ? t('auth.newPassword.match') : t('auth.newPassword.typeTwice')}
        </p>
        <Button type="submit" size="lg" fullWidth disabled={!match || busy}>
          {busy ? t('common.saving') : t('auth.newPassword.saveContinue')}
        </Button>
        {onCancel && (
          <Button variant="bare" onClick={onCancel} className="text-sm text-muted hover:text-ink">
            {t('layout.signOut')}
          </Button>
        )}
      </form>
    </SplashCard>
  )
}
