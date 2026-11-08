import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthed, RequireAuth } from './routes/guards.jsx'
import { AppProviders } from './controllers/shared/providers.jsx'
import { AppRoutes } from './routes/index.jsx'
import { ScrollToTop } from './routes/ScrollToTop.jsx'
import { AppShell } from './components/layout/AppShell.jsx'
import { ConfigProvider } from './controllers/shared/ConfigContext.jsx'
import { PUBLIC } from './routes/paths.js'
import { CustomerAfterPage } from './views/customer/CustomerAfterPage.jsx'
import { ForgotPasswordPage } from './views/signin/ForgotPasswordPage.jsx'
import { LoginPage } from './views/signin/LoginPage.jsx'
import { SetPasswordPage } from './views/signin/SetPasswordPage.jsx'

/**
 * Composition root:
 *
 *   router → providers → { public pages (team sign-in, customer page) | gate → config → shell → routes }
 *
 * The public pages own the whole viewport (the splash). Everything else sits behind the gate,
 * and the config (settings, lists, team) loads once the person is in.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <ScrollToTop />
        <Routes>
          <Route
            path={PUBLIC.login}
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path={PUBLIC.forgot}
            element={
              <RedirectIfAuthed>
                <ForgotPasswordPage />
              </RedirectIfAuthed>
            }
          />
          {/* Reachable signed out (a reset link) and signed in (a temporary password). */}
          <Route path={PUBLIC.setPassword} element={<SetPasswordPage />} />
          {/* The customer's page from the recording email: no sign-in, the link is the key. */}
          <Route path={PUBLIC.after} element={<CustomerAfterPage />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <ConfigProvider>
                  <AppShell>
                    <AppRoutes />
                  </AppShell>
                </ConfigProvider>
              </RequireAuth>
            }
          />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  )
}
