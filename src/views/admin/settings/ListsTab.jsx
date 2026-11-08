import { useState } from 'react'
import Icon from '../../../components/Icon.jsx'
import { Button, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { ListPanel } from './ListPanel.jsx'
import { Section } from './Section.jsx'

/* The lists, grouped by when the team uses them; names, one-line descriptions and group headings
   are settings.lists.names/about/groups. "Rarely changed" starts folded. Documents have their own section. */
const GROUPS = [
  ['adding', ['business_type', 'industry', 'size', 'feature', 'integration']],
  ['onboarding', ['account_part', 'hardware_step', 'setup_check', 'due_choice']],
  ['closing', ['lost_reason']],
  ['rare', ['role', 'step']],
]

/**
 * Admin: every list the team picks from. Pick one on the left (or find it), work on it on the
 * right. Every change saves at once, with Undo.
 */
export function ListsTab({ after, fill }) {
  const { lists } = useConfig()
  const { t } = useLang()
  const [list, setList] = useState('business_type')
  const [query, setQuery] = useState('')
  const [rareOpen, setRareOpen] = useState(false)
  const q = query.trim().toLowerCase()
  const matches = (k) => !q || `${t(`settings.lists.names.${k}`)} ${t(`settings.lists.about.${k}`)}`.toLowerCase().includes(q)
  const groups = GROUPS.map(([g, keys]) => [g, keys.filter(matches)]).filter(([, keys]) => keys.length)

  return (
    <Section id="lists" icon="list" fill={fill}>
      {/* On a fixed-height page (fill) the column of lists and the tiles each scroll on their own. */}
      <div className={cx('grid items-start gap-6 md:grid-cols-[250px_minmax(0,1fr)]', fill && 'lg:min-h-0 lg:flex-1 lg:items-stretch')}>
        <nav aria-label={t('settings.sections.lists.title')} className={cx('flex flex-col gap-3 rounded-[24px] bg-surface p-3', fill && 'scrollbar-slim lg:min-h-0 lg:overflow-y-auto [&>*]:shrink-0')}>
          <label className="flex h-11 items-center gap-2 rounded-xl bg-panel px-3.5 text-sm focus-within:ring-[1.5px] focus-within:ring-brand-700">
            <Icon name="search" className="size-4 shrink-0 text-muted" strokeWidth={1.8} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('settings.lists.find')}
              aria-label={t('settings.lists.find')}
              className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ghost"
            />
          </label>
          {groups.length === 0 && <p className="px-1 text-[13px] text-muted">{t('settings.lists.noMatch', { q: query.trim() })}</p>}
          {groups.map(([g, keys]) => {
            const folded = g === 'rare' && !rareOpen && !q && !keys.includes(list)
            return (
              <div key={g} className="flex flex-col gap-0.5">
                {g === 'rare' ? (
                  <Button variant="bare" aria-expanded={!folded} onClick={() => setRareOpen(folded)} className="flex items-center gap-1 px-3 pt-1.5 pb-1 text-start text-[11px] tracking-[0.14em] text-muted uppercase">
                    {t(`settings.lists.groups.${g}`)}
                    <Icon name="chevronDown" className={cx('size-3 transition-transform', !folded && 'rotate-180')} strokeWidth={2.2} />
                  </Button>
                ) : (
                  <span className="px-3 pt-1.5 pb-1 text-[11px] tracking-[0.14em] text-muted uppercase">{t(`settings.lists.groups.${g}`)}</span>
                )}
                {!folded &&
                  keys.map((k) => (
                    <Button
                      key={k}
                      variant="bare"
                      aria-current={k === list ? 'true' : undefined}
                      onClick={() => setList(k)}
                      className={cx(
                        'flex h-10.5 items-center justify-between gap-2 rounded-xl px-3 text-start text-sm transition',
                        k === list ? 'bg-panel text-brand-800 shadow-[0_2px_8px_-4px_rgb(30_50_80/0.25)]' : 'text-ink hover:bg-panel/60',
                      )}
                    >
                      <span className="truncate">{t(`settings.lists.names.${k}`)}</span>
                      <span className="text-xs text-muted tabular-nums">{(lists[k] ?? []).length}</span>
                    </Button>
                  ))}
              </div>
            )
          })}
        </nav>
        <ListPanel key={list} list={list} after={after} fill={fill} />
      </div>
    </Section>
  )
}
