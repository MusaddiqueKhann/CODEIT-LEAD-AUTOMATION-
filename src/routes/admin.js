import { AdminOverview } from '../views/admin/overview/AdminOverview.jsx'
import { PersonPage } from '../views/admin/person/PersonPage.jsx'
import { CompanySettingsPage } from '../views/admin/settings/CompanySettingsPage.jsx'
import { TeamPage } from '../views/admin/team/TeamPage.jsx'
import { COMPANY_SETTINGS, ROUTES } from './paths.js'

/** The Admin's portal: their dashboard, Team, a person's page and Company settings. */
export default {
  role: 'admin',
  overview: AdminOverview,
  pages: { team: TeamPage },
  routes: [
    { path: `${ROUTES.team}/:id`, Page: PersonPage },
    { path: COMPANY_SETTINGS, Page: CompanySettingsPage },
  ],
}
