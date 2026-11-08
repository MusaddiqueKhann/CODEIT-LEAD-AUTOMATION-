import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as auth from '../../models/data/auth.js'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/**
 * The session and the signed-in person's profile.
 *
 * `session` is undefined until Supabase reports the first state (INITIAL_SESSION), then a
 * session or null. The profile loads in its own effect, never inside the auth callback (awaiting
 * there deadlocks supabase-js). `role` is null while the person must still change their temporary
 * password: the server refuses them the same way.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)
  const [notice, setNotice] = useState(null)
  const userId = session?.user.id

  useEffect(() => auth.onAuthChange((_event, s) => setSession(s)), [])

  useEffect(() => {
    if (!userId) return
    let live = true
    auth.getProfile(userId).then(
      (p) => {
        if (!live) return
        if (!p?.active) {
          // Turned off after signing in: leave now, with a reason on the sign-in page.
          setNotice('Your account is turned off. Ask your Admin.')
          auth.signOut()
        }
        setProfile(p)
      },
      () => live && setProfile(null),
    )
    return () => {
      live = false
    }
  }, [userId])

  const signIn = useCallback(async (email, password) => {
    setNotice(null)
    await auth.signIn(email, password)
  }, [])

  const signOut = useCallback(() => auth.signOut(), [])
  /** The server stopped accepting this sign-in: forget it here and say why on the sign-in page. */
  const endSession = useCallback((message) => {
    setNotice(message)
    auth.signOut('local')
  }, [])
  /** Fetches the profile again and resolves once it is in state (e.g. after a password change). */
  const reloadProfile = useCallback(async () => {
    if (userId) setProfile(await auth.getProfile(userId))
  }, [userId])

  const value = useMemo(() => {
    const current = userId && profile?.id === userId ? profile : null
    return {
      session,
      profile: current,
      role: current?.active && !current.mustChangePassword ? current.role : null,
      // Known once Supabase has answered and, when signed in, the profile has loaded.
      ready: session !== undefined && (!userId || profile?.id === userId || profile === null),
      notice,
      signIn,
      signOut,
      endSession,
      reloadProfile,
    }
  }, [session, userId, profile, notice, signIn, signOut, endSession, reloadProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
