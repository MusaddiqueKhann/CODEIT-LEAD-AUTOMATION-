import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, FullScreenMessage } from '@/components'
import { useAuth } from '../controllers/shared/AuthContext.jsx'
import { useConfigStatus } from '../controllers/shared/ConfigContext.jsx'
import { useLang } from '../controllers/shared/LangContext.jsx'
import { useToast } from '../controllers/shared/ToastContext.jsx'
import { PUBLIC, ROUTES } from './paths.js'

/** The app needs a signed-in, active person who has already set their own password. */
export function RequireAuth({ children }) {
  const { ready, session, profile } = useAuth()
  const { t } = useLang()
  if (!ready) return <FullScreenMessage title={t('shared.common.loading')} />
  if (!session || !profile?.active) return <Navigate to={PUBLIC.login} replace />
  if (profile.mustChangePassword) return <Navigate to={PUBLIC.setPassword} replace />
  return children
}

/** The sign-in pages send someone already signed in straight on. */
export function RedirectIfAuthed({ children }) {
  const { ready, session, profile } = useAuth()
  const { t } = useLang()
  if (!ready) return <FullScreenMessage title={t('shared.common.loading')} />
  if (session && profile?.active) {
    return <Navigate to={profile.mustChangePassword ? PUBLIC.setPassword : ROUTES.overview} replace />
  }
  return children
}

/** The settings, lists and team must be loaded before any page: until then a loading, error or signing-out screen. */
export function RequireConfig({ children }) {
  const { status, error, reload } = useConfigStatus()
  const { t, errorText } = useLang()
  if (status === 'ended') return <FullScreenMessage title={t('shared.common.config.signingOut')} />
  if (status === 'error') {
    return (
      <FullScreenMessage title={t('shared.common.config.couldntLoad')} text={errorText(error)}>
        <Button onClick={reload}>{t('shared.common.tryAgain')}</Button>
      </FullScreenMessage>
    )
  }
  if (status === 'loading') return <FullScreenMessage title={t('shared.common.loading')} />
  return children
}

/** A page outside this role's panel goes to Overview, with a word about why. */
export function RequireRole({ roles, children }) {
  const { role } = useAuth()
  const { toast } = useToast()
  const { t } = useLang()
  const allowed = roles.includes(role)

  useEffect(() => {
    if (!allowed) toast(t('shared.common.notYourPage'), 'warn')
  }, [allowed, toast, t])

  return allowed ? children : <Navigate to={ROUTES.overview} replace />
}
