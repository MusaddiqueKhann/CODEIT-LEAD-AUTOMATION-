import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useMembers } from '../../../controllers/shared/useMembers.js'
import { formatLong, riyadhNow } from '../../../models/rules/format.js'

/**
 * Home: what needs this person today, by role. `dashboards` (from the routes) has each role's
 * dashboard; each opens on its own teal greeting card instead of the page header.
 */
export function OverviewPage({ dashboards }) {
  const { profile } = useAuth()
  const { label } = useConfig()
  const { t, errorText } = useLang()
  const { data: members, error } = useMembers()
  const Dashboard = dashboards[profile.role]

  /* Reads the Riyadh clock: the greeting follows the time the dashboard was opened. */
  const now = riyadhNow()
  const greeting = t(`shared.overview.greeting.${now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}`)

  const title = t('shared.overview.hello', { greeting, name: profile.name.split(' ')[0] })
  const sub = `${formatLong(now)} · ${label('role', profile.role)} · ${t('shared.overview.riyadhTime')}`
  if (error) return <p className="rounded-card bg-panel px-6 py-10 text-center text-sm text-muted shadow-card">{t('shared.overview.couldntLoad', { error: errorText(error) })}</p>
  if (!members) return <p className="rounded-card bg-panel px-6 py-10 text-center text-sm text-muted shadow-card">{t('shared.common.loading')}</p>
  return <Dashboard members={members} me={profile.id} title={title} sub={sub} />
}
