import { AddMemberPage } from '../views/shared/add-member/AddMemberPage.jsx'
import { AlertsPage } from '../views/shared/alerts/AlertsPage.jsx'
import { CalendarPage } from '../views/shared/calendar/CalendarPage.jsx'
import { MembersPage } from '../views/shared/members/MembersPage.jsx'
import { SettingsPage } from '../views/shared/settings/SettingsPage.jsx'
import { TasksPage } from '../views/shared/tasks/TasksPage.jsx'

/** The pages more than one portal opens. Who may open each comes from NAV in paths.js. */
export default {
  pages: {
    tasks: TasksPage,
    calendar: CalendarPage,
    members: MembersPage,
    addMember: AddMemberPage,
    alerts: AlertsPage,
    settings: SettingsPage,
  },
}
