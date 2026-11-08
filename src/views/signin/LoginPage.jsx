import { SplashPanel } from '../../components/layout/SplashPanel.jsx'
import { useAuth } from '../../controllers/shared/AuthContext.jsx'
import { DevSignIn } from './DevSignIn.jsx'
import { LoginForm } from './LoginForm.jsx'

export function LoginPage() {
  const { signIn, notice } = useAuth()
  return (
    <SplashPanel>
      <div className="flex w-full max-w-md flex-col gap-4">
        <LoginForm onSignIn={signIn} notice={notice} />
        <DevSignIn onSignIn={signIn} />
      </div>
    </SplashPanel>
  )
}
