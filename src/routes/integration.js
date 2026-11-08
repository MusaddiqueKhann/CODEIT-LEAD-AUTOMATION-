import { IntegrationCard } from '../views/integration/IntegrationCard.jsx'
import { IntegrationOverview } from '../views/integration/IntegrationOverview.jsx'

/** The Integration portal: their dashboard and the member page's Integration tab. */
export default {
  role: 'integration',
  overview: IntegrationOverview,
  memberTabs: { integration: IntegrationCard },
}
