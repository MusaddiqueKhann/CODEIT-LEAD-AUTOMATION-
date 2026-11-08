import { AuthProvider } from './AuthContext.jsx'
import { LangProvider } from './LangContext.jsx'
import { ToastProvider } from './ToastContext.jsx'

/**
 * The providers every page needs, outermost first: Auth (the session), Lang (the person's language,
 * from their profile), then Toast. The config provider is not here: it needs a signed-in person,
 * so it sits behind the gate in App.jsx.
 */
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <LangProvider>
        <ToastProvider>{children}</ToastProvider>
      </LangProvider>
    </AuthProvider>
  )
}
