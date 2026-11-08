import { AccountCard } from '../views/account/AccountCard.jsx'
import { AccountOverview } from '../views/account/AccountOverview.jsx'

/** The Account portal: their dashboard and the member page's Setup tab. */
export default {
  role: 'account',
  overview: AccountOverview,
  memberTabs: { setup: AccountCard },
}
