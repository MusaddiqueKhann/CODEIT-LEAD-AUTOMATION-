import { useSearchParams } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { PageHeader } from '../../../components/layout/PageHeader.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { listSettingsLog } from '../../../models/data/settings.js'
import { useRows } from '../../../controllers/shared/useRows.js'
import { formatShort } from '../../../models/rules/format.js'
import { COMPANY_PARTS } from '../../../routes/paths.js'
import { CompanyTab } from './CompanyTab.jsx'
import { DocumentsSection } from './DocumentsSection.jsx'
import { HistoryTab } from './HistoryTab.jsx'
import { HolidaysSection } from './HolidaysSection.jsx'
import { ListsTab } from './ListsTab.jsx'
import { SettingsShell } from '../../shared/settings/SettingsShell.jsx'
import { TextsTab } from './TextsTab.jsx'
import { TimingTab } from './TimingTab.jsx'
import { WorkingWeekTab } from './WorkingWeekTab.jsx'

/* Each section's part; their order is COMPANY_PARTS (the design's). */
/* The sections that save as you go (with Undo): opened alone, they need no Save bar. */
const INSTANT = ['holidays', 'lists', 'docs', 'history']
const PART = {
  timing: TimingTab,
  week: WorkingWeekTab,
  holidays: HolidaysSection,
  lists: ListsTab,
  docs: DocumentsSection,
  texts: TextsTab,
  company: CompanyTab,
  history: HistoryTab,
}

/**
 * Admin: everything the rules run on, as sections saved together from the bar. The sidebar opens
 * one at a time (?part=timing); with no part, the whole page.
 */
export function CompanySettingsPage() {
  const { brand } = useConfig()
  const { t } = useLang()
  const [params] = useSearchParams()
  const part = params.get('part')
  const shown = COMPANY_PARTS.includes(part) ? [part] : COMPANY_PARTS
  return (
    <SettingsShell
      key={shown.join()}
      bar={shown.every((p) => INSTANT.includes(p)) ? false : 'companyBar'}
      // Lists on its own fits the screen, and scrolls inside.
      fill={part === 'lists'}
      parts={shown.map((p) => [p, PART[p]])}
      header={
        <PageHeader
          media={
            <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <Icon name="building" className="size-6" strokeWidth={1.8} />
            </span>
          }
          title={t('settings.page.titleCompany')}
          sub={t('settings.page.subCompany', { app: brand.app })}
          actions={<LastSaved />}
        />
      }
    />
  )
}

/** "Last saved Mon 02 Nov · Musaddique": the newest change in History. */
function LastSaved() {
  const { person, loadedAt } = useConfig()
  const { t } = useLang()
  const { data: log } = useRows(listSettingsLog, `history:${loadedAt}`)
  const last = log?.[0]
  if (!last) return null
  const name = person(last.actorId)?.name.split(' ')[0] ?? t('settings.history.someone')
  return (
    <span className="inline-flex h-8.5 items-center rounded-full bg-surface px-3.5 text-[13px] whitespace-nowrap text-soft">
      {t('settings.page.lastSaved', { date: formatShort(last.at), name })}
    </span>
  )
}
