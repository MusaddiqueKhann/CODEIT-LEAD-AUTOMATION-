import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useSettingsLog } from '../../../controllers/admin/settings.js'
import { formatStamp } from '../../../models/rules/format.js'
import { describeChange } from '../../../models/rules/history.js'
import { initials } from '../../../models/rules/time.js'
import { Section } from './Section.jsx'

/** Admin: every change to the settings, lists, wording and holidays, newest first, and who made it. */
export function HistoryTab() {
  const { person } = useConfig()
  const { t, lang, errorText } = useLang()
  // Reads again whenever the settings reload, so a save shows here at once.
  const { data: log, error } = useSettingsLog()

  return (
    <Section id="history" icon="history" className="gap-0">
      {error ? (
        <p className="text-sm text-danger-ink">{t('admin.settings.history.couldntLoad', { error: errorText(error) })}</p>
      ) : !log ? (
        <p className="text-sm text-muted">{t('shared.common.loading')}</p>
      ) : log.length === 0 ? (
        <p className="text-sm text-muted">{t('admin.settings.history.empty')}</p>
      ) : (
        <ul className="scrollbar-slim -mt-2 flex max-h-105 flex-col overflow-y-auto">
          {log.map((r) => {
            const { what, change } = describeChange(r, t, lang)
            const who = person(r.actorId)?.name ?? t('admin.settings.history.someone')
            return (
              <li key={r.id} className="flex items-center gap-3.5 border-b border-line-soft py-3 last:border-b-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-800 text-[11px] text-white">{initials(who)}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm text-ink">
                    <span className="font-medium first-letter:uppercase">{what}</span> <span className="text-soft">· {change}</span>
                  </span>
                  <span className="truncate text-xs text-muted">{who}</span>
                </span>
                <span className="shrink-0 text-xs whitespace-nowrap text-muted">{formatStamp(r.at)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}
