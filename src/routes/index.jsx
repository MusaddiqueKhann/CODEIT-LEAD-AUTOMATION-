import { Navigate, Route, Routes } from 'react-router-dom'
import { COMPANY_SETTINGS, NAV, ROUTES } from './paths.js'
import { RequireRole } from './guards.jsx'
import { AddMemberPage } from '../views/shared/add-member/AddMemberPage.jsx'
import { AlertsPage } from '../views/shared/alerts/AlertsPage.jsx'
import { CompanySettingsPage } from '../views/admin/settings/CompanySettingsPage.jsx'
import { CalendarPage } from '../views/shared/calendar/CalendarPage.jsx'
import { MemberDetailsPage } from '../views/shared/member/MemberDetailsPage.jsx'
import { MembersPage } from '../views/shared/members/MembersPage.jsx'
import { OverviewPage } from '../views/shared/overview/OverviewPage.jsx'
import { PersonPage } from '../views/admin/person/PersonPage.jsx'
import { SettingsPage } from '../views/shared/settings/SettingsPage.jsx'
import { TasksPage } from '../views/shared/tasks/TasksPage.jsx'
import { TeamPage } from '../views/admin/team/TeamPage.jsx'

/** Which page each nav entry opens. Paths and roles come from lib/nav.js. */
const PAGES = {
  overview: OverviewPage,
  tasks: TasksPage,
  calendar: CalendarPage,
  members: MembersPage,
  addMember: AddMemberPage,
  team: TeamPage,
  alerts: AlertsPage,
  settings: SettingsPage,
}

/** The pages inside the shell. Every role-limited page goes through RequireRole. */
export function AppRoutes() {
  return (
    <Routes>
      {NAV.map(({ key, path, roles }) => {
        const Page = PAGES[key]
        return (
          <Route
            key={key}
            path={path}
            element={
              <RequireRole roles={roles}>
                <Page />
              </RequireRole>
            }
          />
        )
      })}
      {/* Every role opens member details; the server only returns the members that are theirs. */}
      <Route path={`${ROUTES.members}/:code`} element={<MemberDetailsPage />} />
      {/* A team member's page: the Admin's, like Team itself. */}
      <Route
        path={`${ROUTES.team}/:id`}
        element={
          <RequireRole roles={NAV.find((n) => n.key === 'team').roles}>
            <PersonPage />
          </RequireRole>
        }
      />
      {/* The Admin's company settings, opened from Settings in the sidebar. */}
      <Route
        path={COMPANY_SETTINGS}
        element={
          <RequireRole roles={['admin']}>
            <CompanySettingsPage />
          </RequireRole>
        }
      />
      {/* A typed URL lands on Overview rather than an empty shell. */}
      <Route path="*" element={<Navigate to={ROUTES.overview} replace />} />
    </Routes>
  )
}
