import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, ListHead, PageHeader, SearchBox, Tabs } from '@/components'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useMembers } from '../../../controllers/shared/useMembers.js'
import { dayKey, formatLong, riyadhNow } from '../../../models/rules/format.js'
import { taskOf } from '../../../models/rules/tasks.js'
import { addDays } from '../../../models/rules/time.js'
import { COLUMNS, TaskRow } from './TaskRow.jsx'

/* Late first, then by the day it's due; no date last. */
const byDue = (a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999')

/** My tasks: every member waiting on this person, with what to do and by when; ?step= narrows it. Laid out like Members. */
export function TasksPage() {
  const { profile } = useAuth()
  const { label, active, brand } = useConfig()
  const { t, errorText } = useLang()
  const { data: members, error } = useMembers()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [params] = useSearchParams()
  const step = params.get('step') ?? ''
  const now = riyadhNow()
  const today = dayKey(now)
  const weekEnd = dayKey(addDays(now, 6 - now.getDay()))

  const ctx = { labelOf: label, setupKeys: active('setup_check').map((o) => o.key), product: brand.product, t }
  const tasks = (members ?? [])
    .map((m) => ({ ...taskOf(m, profile.id, ctx), member: m }))
    .filter((t) => t.todo && (!step || t.step === step))
    .sort(byDue)
  const q = query.trim().toLowerCase()
  const found = tasks.filter((t) => !q || [t.member.name, t.member.company, t.todo].some((v) => v.toLowerCase().includes(q)))
  const late = (t) => t.due && t.due < today
  const week = (t) => t.due && t.due >= today && t.due <= weekEnd
  const shown = found.filter(tab === 'late' ? late : tab === 'week' ? week : Boolean)
  const tabs = [
    { key: 'all', label: t('shared.tasks.tabs.todo'), count: found.length },
    { key: 'late', label: t('shared.tasks.tabs.late'), count: found.filter(late).length },
    { key: 'week', label: t('shared.tasks.tabs.week'), count: found.filter(week).length },
  ]

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-2rem)]">
      <PageHeader title={t('shared.tasks.title')} sub={`${t('shared.tasks.sub', { date: formatLong(now), n: tasks.length })}${step ? ` · ${label('step', step)}` : ''}`}>
        <SearchBox id="tasks-page-search-label" value={query} onChange={setQuery} placeholder={t('shared.tasks.searchPlaceholder')} label={t('shared.tasks.searchLabel')} />
      </PageHeader>

      <Card padding="none" clip className="flex animate-rise flex-col [animation-delay:.08s] lg:min-h-0 lg:flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <Tabs id="tasks-page-set-tab" items={tabs} value={tab} onChange={setTab} />
        </div>

        <div className="scrollbar-slim min-h-0 flex-1 overflow-auto">
          <div className="min-w-190">
            <div className="sticky top-0 z-2 bg-panel px-3 pt-3 pb-1.5">
              <ListHead columns={COLUMNS}>
                <span className="ps-13.5">{t('shared.tasks.columns.member')}</span>
                <span>{t('shared.tasks.columns.todo')}</span>
                <span>{t('shared.tasks.columns.due')}</span>
                <span>{t('shared.tasks.columns.step')}</span>
                <span />
              </ListHead>
            </div>
            {shown.map((t, i) => (
              <TaskRow key={`${t.member.id}:${t.step}`} task={t} today={today} index={i} />
            ))}
            {error && <p className="px-6 py-12 text-center text-sm text-muted">{t('shared.tasks.couldntLoad', { error: errorText(error) })}</p>}
            {!members && !error && <p className="px-6 py-12 text-center text-sm text-muted">{t('shared.tasks.loading')}</p>}
            {members && shown.length === 0 && (
              <p className="px-6 py-12 text-center text-sm text-muted">
                {t(q ? 'shared.tasks.empty.search' : tab === 'late' ? 'shared.tasks.empty.late' : tab === 'week' ? 'shared.tasks.empty.week' : 'shared.tasks.empty.all')}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
