import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './controllers/shared/AuthContext.jsx'
import { LangProvider } from './controllers/shared/LangContext.jsx'
import { ToastProvider } from './controllers/shared/ToastContext.jsx'
import { AppRoutes } from './routes/index.jsx'
import { ScrollToTop } from './routes/ScrollToTop.jsx'

/*
 * The app starts here: the router, then what every page needs, outermost first: Auth (the session),
 * Lang (the person's language, from their profile), Toast. The routes do the rest, portal by portal.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <ToastProvider>
            <ScrollToTop />
            <AppRoutes />
          </ToastProvider>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
