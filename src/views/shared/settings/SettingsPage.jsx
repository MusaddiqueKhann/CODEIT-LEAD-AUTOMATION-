import { Navigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { COMPANY_SETTINGS } from '../../../routes/paths.js'
import { AvailabilityTab } from './AvailabilityTab.jsx'
import { ProfileTab } from './ProfileTab.jsx'
import { SettingsShell } from './SettingsShell.jsx'

/* The page's parts, in order; each one's name is shared.settings.parts.<key>. */
const PARTS = [
  ['profile', ProfileTab],
  ['availability', AvailabilityTab],
]

/** Your own profile and availability. The Admin's company settings are their own page (an old ?part=company link goes there). */
export function SettingsPage() {
  const { t } = useLang()
  const [params] = useSearchParams()
  if (params.get('part') === 'company') return <Navigate to={COMPANY_SETTINGS} replace />
  return <SettingsShell labelled parts={PARTS} header={<PageHeader title={t('shared.settings.page.titlePersonal')} sub={t('shared.settings.page.subPersonal')} />} />
}
