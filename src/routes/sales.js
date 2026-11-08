import { SalesOverview } from '../views/sales/SalesOverview.jsx'
import { SalesTab } from '../views/sales/SalesTab.jsx'

/** The Sales portal: their dashboard and the member page's Sales tab. */
export default {
  role: 'sales',
  overview: SalesOverview,
  memberTabs: { sales: SalesTab },
}
