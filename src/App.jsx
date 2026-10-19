import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './app/providers.jsx'
import { AppRoutes } from './app/routes.jsx'
import { ScrollToTop } from './app/ScrollToTop.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { AppShell } from './components/layout/AppShell.jsx'
import Login from './pages/Login.jsx'
import { ROUTES } from './lib/nav.js'

/**
 * Composition root, and deliberately nothing else — no state, no route table,
 * no page map. Each of those now has a file, so this one stays readable as the
 * app's shape:
 *
 *   router → providers → { login | gate → shell → routes }
 *
 * The split at the top level is what lets `/login` be a full-bleed splash: it
 * renders on its own, outside the sidebar AppShell, while every other path is
 * wrapped in the shell as before. Providers sit above both because
 * BookingProvider reads the location.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <ScrollToTop />
        <Routes>
          {/* Shell-less: the login page owns the whole viewport. A trainee who
              is already signed in never sees the splash — they are sent on. */}
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <Login />
              </RedirectIfAuthed>
            }
          />
          {/* Everything else lives inside the shell and its own route table,
              behind the gate — signed out lands back on the splash. */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppShell>
                  <AppRoutes />
                </AppShell>
              </RequireAuth>
            }
          />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  )
}

/** Gate for the app: no session → back to the splash. */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

/** Inverse gate for the splash: an existing session skips straight to the app. */
function RedirectIfAuthed({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to={ROUTES.overview} replace /> : children
}
