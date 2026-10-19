import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/* Where the signed-in flag is kept, so a refresh doesn't bounce the trainee
   back to the splash. This client has no backend, so the flag is the whole
   session — there is no token to store. */
const STORAGE_KEY = 'codeit.signedIn'

/* localStorage throws in private-mode Safari and when storage is disabled;
   auth must degrade to in-memory rather than crash the whole app on read. */
function readInitial() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * The session slice — is anyone signed in, and the two verbs that flip it.
 *
 * Sits at the top of the provider stack (see app/providers.jsx): the router's
 * gate reads it to decide splash-vs-app, and the sidebar's Sign out calls it.
 * There is no real credential check — signIn() trusts its caller, because the
 * Login form is the only caller and this client talks to no auth server.
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(readInitial)

  const signIn = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* Storage unavailable — stay signed in for this tab only. */
    }
    setIsAuthenticated(true)
  }, [])

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* Nothing persisted to clear; the state reset below is what matters. */
    }
    setIsAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, signIn, signOut }),
    [isAuthenticated, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
