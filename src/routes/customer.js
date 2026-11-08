import { CustomerAfterPage } from '../views/customer/CustomerAfterPage.jsx'
import { PUBLIC } from './paths.js'

/** The customer's page from the recording email: no sign-in, the link is the key. */
export default {
  routes: [{ path: PUBLIC.after, Page: CustomerAfterPage }],
}
