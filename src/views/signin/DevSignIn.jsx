import { useState } from 'react'
import { Button, TONES } from '@/components'
import { useLang } from '../../controllers/shared/LangContext.jsx'

/*
 * Sample data only: one click signs in as each seed login, so every panel can be checked.
 * Shown only in development, and the list comes from .env.local, never from the code:
 *   VITE_DEV_LOGINS="Admin=admin@codeit.test,New hire=tariq@codeit.test:<temporary password>"
 *   VITE_DEV_PASSWORD=…   (used when a login has no ":password" of its own)
 * Read only under `import.meta.env.DEV`, so a production build never contains them.
 */
const LOGINS = import.meta.env.DEV
  ? (import.meta.env.VITE_DEV_LOGINS ?? '')
      .split(',')
      .filter(Boolean)
      .map((entry) => {
        const [label, rest] = entry.split('=')
        const [email, password] = rest.split(':')
        return { label: label.trim(), email: email.trim(), password: password ?? import.meta.env.VITE_DEV_PASSWORD }
      })
  : []

export function DevSignIn({ onSignIn }) {
  const { t, errorText } = useLang()
  const [error, setError] = useState(null)
  if (LOGINS.length === 0) return null

  const pick = async (login) => {
    setError(null)
    try {
      await onSignIn(login.email, login.password)
    } catch (err) {
      setError(`${login.label}: ${errorText(err)}`)
    }
  }

  return (
    <div className="w-full max-w-md rounded-[22px] bg-panel/85 p-4 shadow-xl ring-1 ring-white/40 backdrop-blur-xl">
      <p className="eyebrow px-1 text-muted">{t('signin.devSignIn')}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {LOGINS.map((login) => (
          <Button id={`dev-sign-in-pick-${login.email}`}
            key={login.email}
            variant="bare"
            onClick={() => pick(login)}
            title={login.email}
            className="h-9 rounded-full bg-surface-2 px-3.5 text-[13px] text-ink transition hover:bg-brand-100"
          >
            {login.label}
          </Button>
        ))}
      </div>
      {error && <p className={`mt-2 px-1 text-xs ${TONES.danger.text}`}>{error}</p>}
    </div>
  )
}
