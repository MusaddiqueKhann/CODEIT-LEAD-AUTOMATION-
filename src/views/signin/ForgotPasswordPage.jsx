import { SplashPanel } from '../../components/layout/SplashPanel.jsx'
import { requestReset } from '../../models/data/auth.js'
import { ForgotForm } from './ForgotForm.jsx'

export function ForgotPasswordPage() {
  return (
    <SplashPanel>
      <ForgotForm onSend={requestReset} />
    </SplashPanel>
  )
}
