import { ForgotPasswordPage } from '../views/signin/ForgotPasswordPage.jsx'
import { LoginPage } from '../views/signin/LoginPage.jsx'
import { SetPasswordPage } from '../views/signin/SetPasswordPage.jsx'
import { PUBLIC } from './paths.js'

/**
 * The signed-out pages. `signedOut` ones send someone already in straight on. Choosing a password
 * is open both ways: a reset link (signed out) and a temporary password (signed in).
 */
export default {
  routes: [
    { path: PUBLIC.login, Page: LoginPage, signedOut: true },
    { path: PUBLIC.forgot, Page: ForgotPasswordPage, signedOut: true },
    { path: PUBLIC.setPassword, Page: SetPasswordPage },
  ],
}
