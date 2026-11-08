import { useState } from 'react'
import { Button, Input } from '@/components'
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
        <Button id="password-input-hide-password"
          variant="bare"
          onClick={() => setShow((v) => !v)}
          className="absolute top-1/2 end-3 -translate-y-1/2 text-xs font-medium text-muted transition hover:text-ink"
          aria-label={show ? t('signin.hidePassword') : t('signin.showPassword')}
        >
          {show ? t('signin.hide') : t('signin.show')}
        </Button>
      }
    />
  )
}
