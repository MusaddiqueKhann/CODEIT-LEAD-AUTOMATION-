import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, FullScreenMessage, Notice, SplashCard, SplashPanel } from '@/components'
import { useAuth } from '../../controllers/shared/AuthContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { updatePassword, verifyRecovery } from '../../controllers/signin.js'
import { useBrand } from '../../controllers/shared/useBrand.js'
import { PUBLIC, ROUTES } from '../../routes/paths.js'
import { PasswordForm } from './PasswordForm.jsx'

/**
 * Two ways in: signed in on a temporary password (it can't be skipped), or from a reset link.
 * The reset link only carries a token; the session opens when the person clicks Continue, so
 * a mail scanner opening the link can't use it up.
 */
export function SetPasswordPage() {
  const { ready, session, profile, reloadProfile, signOut } = useAuth()
  const { t } = useLang()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const tokenHash = params.get('token_hash')

  if (!ready) return <FullScreenMessage title={t('shared.common.loading')} />
  if (!session && !tokenHash) return <Navigate to={PUBLIC.login} replace />

  const save = async (password) => {
    await updatePassword(password)
    await reloadProfile()
    navigate(ROUTES.overview, { replace: true })
  }

  const first = profile?.mustChangePassword
  return (
    <SplashPanel page="set-password">
      {session ? (
        <PasswordForm
          title={first ? t('signin.newPassword.welcome', { name: profile.name.split(' ')[0] }) : t('signin.newPassword.choose')}
          sub={t(first ? 'signin.newPassword.firstSub' : 'signin.newPassword.nextSub')}
          onSave={save}
          onCancel={signOut}
        />
      ) : (
        <RecoveryStart onContinue={() => verifyRecovery(tokenHash)} />
      )}
    </SplashPanel>
  )
}

function RecoveryStart({ onContinue }) {
  const brand = useBrand()
  const { t, errorText } = useLang()
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const go = async () => {
    setBusy(true)
    try {
      await onContinue()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <SplashCard title={t('signin.recovery.title')} sub={t('signin.recovery.sub', { app: brand.app })}>
      <div className="mt-7 flex flex-col gap-4">
        <Notice role="alert">{error}</Notice>
        <Button id="set-password-page-checking" size="lg" fullWidth onClick={go} disabled={busy}>
          {busy ? t('signin.recovery.checking') : t('signin.recovery.continue')}
        </Button>
        {error && (
          <Link id="set-password-page-new-link" to={PUBLIC.forgot} className="v-set-password-page__new-link text-center text-sm font-medium text-brand-700 hover:text-brand-800">
            {t('signin.recovery.newLink')}
          </Link>
        )}
      </div>
    </SplashCard>
  )
}
