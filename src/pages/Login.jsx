import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginForm, SplashPanel } from '../components/auth/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ROUTES } from '../lib/nav.js'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  // Once true, the form is swapped for the success tick, then we redirect.
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // No backend in this client — a valid submit is treated as success. Show
    // the confirmation first, then hand off to the app.
    setSucceeded(true)
  }

  // Hold the "Sign in successful" tick briefly so it registers, then open the
  // session and let the gate in App.jsx drop the trainee into the app.
  useEffect(() => {
    if (!succeeded) return
    const t = setTimeout(() => {
      signIn()
      navigate(ROUTES.overview, { replace: true })
    }, 1400)
    return () => clearTimeout(t)
  }, [succeeded, signIn, navigate])

  return (
    <SplashPanel>
      <LoginForm succeeded={succeeded} onSubmit={handleSubmit} />
    </SplashPanel>
  )
}
