import { SplashPanel } from '@/components'
import { requestReset } from '../../controllers/signin.js'
import { ForgotForm } from './ForgotForm.jsx'

export function ForgotPasswordPage() {
  return (
    <SplashPanel page="forgot">
      <ForgotForm onSend={requestReset} />
    </SplashPanel>
  )
}
