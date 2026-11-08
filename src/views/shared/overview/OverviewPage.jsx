import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useMembers } from '../../../controllers/shared/useMembers.js'
import { formatLong, riyadhNow } from '../../../models/rules/format.js'
import { AccountOverview } from '../../account/AccountOverview.jsx'
import { AdminOverview } from '../../admin/overview/AdminOverview.jsx'
import { IntegrationOverview } from '../../integration/IntegrationOverview.jsx'
import { OnboardingOverview } from '../../onboarding/OnboardingOverview.jsx'
import { SalesOverview } from '../../sales/SalesOverview.jsx'

/* Each role's dashboard; each opens on its own teal greeting card instead of the page header. */
const DASHBOARDS = {
  admin: AdminOverview,
  sales: SalesOverview,
  account: AccountOverview,
  integration: IntegrationOverview,
  onboarding: OnboardingOverview,
}

/** Home: what needs this person today, by role. */
export function OverviewPage() {
  const { profile } = useAuth()
  const { label } = useConfig()
  const { t, errorText } = useLang()
  const { data: members, error } = useMembers()
  const Dashboard = DASHBOARDS[profile.role]

  /* Reads the Riyadh clock: the greeting follows the time the dashboard was opened. */
  const now = riyadhNow()
  const greeting = t(`overview.greeting.${now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}`)

  const title = t('overview.hello', { greeting, name: profile.name.split(' ')[0] })
  const sub = `${formatLong(now)} · ${label('role', profile.role)} · ${t('overview.riyadhTime')}`
  if (error) return <p className="rounded-card bg-panel px-6 py-10 text-center text-sm text-muted shadow-card">{t('overview.couldntLoad', { error: errorText(error) })}</p>
  if (!members) return <p className="rounded-card bg-panel px-6 py-10 text-center text-sm text-muted shadow-card">{t('common.loading')}</p>
  return <Dashboard members={members} me={profile.id} title={title} sub={sub} />
}
