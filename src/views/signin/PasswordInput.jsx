import { useState } from 'react'
import { Button, Input } from '../../components/ui/index.js'
import { useLang } from '../../controllers/shared/LangContext.jsx'

/** A password input with Show / Hide. `props` are the Field's id and aria wiring. */
export function PasswordInput({ props, ...rest }) {
  const { t } = useLang()
  const [show, setShow] = useState(false)
  return (
    <Input
      {...props}
      {...rest}
      icon="shield"
      className="pe-16"
      type={show ? 'text' : 'password'}
      required
      trailing={
        <Button
          variant="bare"
          onClick={() => setShow((v) => !v)}
          className="absolute top-1/2 end-3 -translate-y-1/2 text-xs font-medium text-muted transition hover:text-ink"
          aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {show ? t('auth.hide') : t('auth.show')}
        </Button>
      }
    />
  )
}
