import { Link } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'
import { Card, cx } from '../../components/ui/index.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { listRecentActivity } from '../../models/data/members.js'
import { useCounts } from '../../controllers/shared/useCounts.js'
import { useRows } from '../../controllers/shared/useRows.js'
import { ago, dayKey, formatShort, fromDay, fromServer, riyadhNow, startOfDay, weekdayShort } from '../../models/rules/format.js'
import { ROUTES, memberPath } from '../../routes/paths.js'
import { addDays, initials, workingDaysUntil } from '../../models/rules/time.js'
import { TONES } from '../../components/tones.js'
import { CardHead } from '../shared/overview/CardHead.jsx'
import { Hero } from '../shared/overview/Hero.jsx'
import { IconTile } from '../shared/overview/IconTile.jsx'
import { RingCard } from '../shared/overview/OverviewRings.jsx'
import { RecentActivity } from '../shared/overview/RecentActivity.jsx'
import { WeekChart } from '../shared/overview/WeekChart.jsx'
import { dayDate, open } from '../../models/rules/when.js'

/* What Recent activity counts, from the activity lines' kind (named in overview.integration.counters). A Transfer of one of their members reached them. */
const counters = (mine) => [
  ['received', (l) => l.kind === 'transferred' && mine.has(l.memberId)],
  ['connected', (l) => l.kind === 'connected'],
  ['tested', (l) => l.kind === 'tested'],
  ['sentBack', (l) => l.kind === 'sent_back'],
]
const check = (m, k) => m.integrationChecks?.[k] ?? {}

/**
 * The Integration Person's dashboard: their integrations as a ring (with them, sent back, finished
 * this month), what is due next, waiting on a provider or ready to test, each member's integrations
 * and time left, what they sent back, their members' sessions, how they're doing, and this week.
 */
export function IntegrationOverview({ members, me, title, sub }) {
  const { label, settings, holidays, person } = useConfig()
  const { t } = useLang()
  const g = (key, values) => t(`overview.integration.${key}`, values)
  const counts = useCounts(me)
  const { dueSoonDays, aheadDays, recentDays } = settings
  const activity = useRows(() => listRecentActivity(new Date(Date.now() - recentDays * 864e5).toISOString()), `activity:${recentDays}d`)
  const now = riyadhNow()
  const today = startOfDay(now)
  const off = new Set(holidays.map((h) => h.day))
  const weekStart = addDays(today, -today.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthAgo = new Date(now - recentDays * 864e5)
  const M = ROUTES.members

  const mine = members.filter((m) => m.integrationId === me)
  const left = (m) => (m.integrationDue ? workingDaysUntil(today, fromDay(m.integrationDue), settings.officeHours, off) : null)
  const withMe = mine.filter((m) => open(m) && m.stage === 'integration').sort((a, b) => (a.integrationDue ?? '9').localeCompare(b.integrationDue ?? '9'))
  const late = withMe.filter((m) => m.late.includes('integration'))
  const soon = withMe.filter((m) => !late.includes(m) && left(m) != null && left(m) <= dueSoonDays)
  const back = mine.filter((m) => open(m) && m.stage === 'collecting' && m.sentBackBy === me).sort((a, b) => (b.sentBackAt ?? '').localeCompare(a.sentBackAt ?? ''))
  const pairs = withMe.flatMap((m) => m.integrations.map((k) => ({ m, k, c: check(m, k) })))
  const waiting = pairs.filter((p) => p.c.waiting)
  const toTest = pairs.filter((p) => p.c.connected && !p.c.tested)
  const finished = mine.filter((m) => m.integrationDoneAt).map((m) => ({ m, at: fromServer(m.integrationDoneAt) }))
  const sessions = [...withMe, ...back].filter((m) => m.session).sort((a, b) => a.session.at - b.session.at)
  const next = withMe[0]
  const names = (m) => m.integrations.filter((k) => !(check(m, k).connected && check(m, k).tested)).map((k) => label('integration', k)).join(t('overview.sep'))
  const daysLeft = (m) => {
    const n = left(m)
    return m.late.includes('integration') ? g('late') : n == null ? g('noDueDate') : n === 0 ? g('dueToday') : t('overview.left', { days: t('overview.counts.workingDay', { n }) })
  }

  // How they're doing, over the integrations finished in the Admin's recent days.
  const lines = activity.data ?? []
  const recent = finished.filter((f) => f.at >= monthAgo)
  const share = (test) => (recent.length ? Math.round((100 * recent.filter(test).length) / recent.length) : null)
  const onTime = share((f) => !f.m.integrationDue || dayKey(f.at) <= f.m.integrationDue)
  const firstTest = share((f) => !lines.some((l) => l.memberId === f.m.id && l.kind === 'sent_back'))
  const took = recent
    .map((f) => [f, lines.find((l) => l.memberId === f.m.id && l.kind === 'transferred')])
    .filter(([, l]) => l)
    .map(([f, l]) => (f.at - l.at) / 864e5)
  const average = took.length ? took.reduce((a, b) => a + b, 0) / took.length : null
  const week = lines.filter((l) => l.at >= weekStart && mine.some((m) => m.id === l.memberId))

  return (
    <div className="flex flex-col gap-4">
      <Hero
        title={title}
        sub={sub}
        unread={counts.unread ?? 0}
        unit={t('overview.units.thisMonth')}
        round
        parts={[
          { key: 'with', label: g('parts.with'), n: withMe.length, color: '#ffffff', to: `${M}?show=mine&step=integration` },
          { key: 'soon', label: g('parts.soon', { days: t('overview.counts.workingDay', { n: dueSoonDays }) }), n: soon.length, color: '#b8dbd9', to: `${M}?show=mine&step=integration`, ring: false },
          { key: 'late', label: g('parts.late'), n: late.length, color: '#f3a8a0', to: `${M}?show=mine&step=integration`, ring: false },
          { key: 'back', label: g('parts.back', { step: label('step', 'sales') }), n: back.length, color: '#e9b27a', to: `${M}?show=mine&step=sales` },
          { key: 'done', label: g('parts.done'), n: finished.filter((f) => f.at >= monthStart).length, color: '#7fbab7', to: `${M}?show=mine`, tile: false },
        ]}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <IconTile
          index={0}
          to={next ? `${memberPath(next.code)}?tab=integration` : `${M}?show=mine`}
          icon="clock"
          tone="warn"
          label={g('nextDue')}
          big={next ? `${next.name.split(' ')[0]} · ${next.integrationDue ? dayDate(fromDay(next.integrationDue)) : g('noDate')}` : g('nothingDue')}
          sub={next ? [names(next), daysLeft(next).toLowerCase()].filter(Boolean).join(' · ') : g('noneWithYou')}
        />
        <IconTile
          index={1}
          to={waiting[0] ? `${memberPath(waiting[0].m.code)}?tab=integration` : `${M}?show=mine`}
          icon="link"
          tone="indigo"
          label={g('waiting')}
          big={t('overview.counts.integration', { n: waiting.length })}
          sub={waiting.length ? waiting.slice(0, 2).map((p) => `${p.m.name.split(' ')[0]} · ${label('integration', p.k)}`).join(' · ') : g('nothingWaiting')}
        />
        <IconTile
          index={2}
          to={toTest[0] ? `${memberPath(toTest[0].m.code)}?tab=integration` : `${M}?show=mine`}
          icon="check"
          tone="success"
          label={g('toTest')}
          big={t('overview.counts.integration', { n: toTest.length })}
          sub={toTest.length ? toTest.slice(0, 2).map((p) => g('connectedLine', { name: p.m.name.split(' ')[0], integration: label('integration', p.k) })).join(' · ') : g('nothingToTest')}
        />
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <Card as="section" radius="rounded-tile" padding="none" className="flex min-w-0 flex-[3_1_520px] animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.2s]">
          <CardHead title={g('mineTitle')} sub={g('mineSub')} to={`${M}?show=mine&step=integration`} label={t('overview.links.viewAll')} />
          <div className="flex flex-col gap-2.5">
            {withMe.map((m, i) => {
              const checks = m.integrations.length * 2
              const done = m.integrations.reduce((n, k) => n + (check(m, k).connected ? 1 : 0) + (check(m, k).tested ? 1 : 0), 0)
              const n = left(m)
              const isLate = m.late.includes('integration')
              return (
                <div key={m.id} style={{ animationDelay: `${0.25 + i * 0.06}s` }} className="flex animate-rise flex-col gap-3.5 rounded-3xl bg-surface-2 px-5 py-4.5">
                  <div className="flex flex-wrap items-center gap-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-900 text-[13px] text-white">{initials(m.name)}</span>
                    <span className="flex min-w-45 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] text-ink">{m.name}</span>
                      <span className="text-[13px] text-muted">{[m.company, m.plan && label('business_type', m.plan)].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="flex flex-col items-end gap-0.5">
                      <span className="text-xs text-muted">{m.integrationDue ? g('due', { day: formatShort(fromDay(m.integrationDue)) }) : g('noDueYet')}</span>
                      <span className={cx('text-sm', isLate ? TONES.danger.text : n != null && n <= 1 ? TONES.warn.text : 'text-ink')}>{daysLeft(m)}</span>
                    </span>
                    <Link
                      to={`${memberPath(m.code)}?tab=integration`}
                      className="inline-flex h-10 w-30 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm text-white transition hover:bg-brand-800 hover:text-white"
                    >
                      {g('open')}
                    </Link>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2">
                    {m.integrations.map((k) => {
                      const c = check(m, k)
                      return (
                        <div key={k} className="flex items-center gap-2 rounded-[18px] bg-panel px-3.5 py-3">
                          <span className="flex-1 text-sm text-ink">{label('integration', k)}</span>
                          {c.waiting && !c.connected ? <Pill tone="warn">{g('pillWaiting')}</Pill> : <Pill on={c.connected}>{g('pillConnected')}</Pill>}
                          <Pill on={c.tested}>{g('pillTested')}</Pill>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#dfe5ea]">
                      <span className="block h-full rounded-full bg-brand-700" style={{ width: `${checks ? (100 * done) / checks : 0}%` }} />
                    </span>
                    <span className="text-xs text-muted">{g('checks', { done, total: checks })}</span>
                  </div>
                </div>
              )
            })}
            {withMe.length === 0 && <p className="py-6 text-center text-sm text-muted">{g('noneNow')}</p>}
          </div>
        </Card>

        <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-4">
          <Card as="section" radius="rounded-tile" padding="none" className="flex animate-rise flex-col gap-3 px-6 py-5 [animation-delay:.25s]">
            <CardHead title={g('backTitle', { step: label('step', 'sales') })} to={`${M}?show=mine&step=sales`} label={t('overview.links.viewAll')} />
            {back.map((m) => (
              <Link key={m.id} to={memberPath(m.code)} className="flex items-start gap-3.5 rounded-[22px] bg-warn-wash px-4.5 py-4 text-ink transition-colors hover:bg-warn-bg">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-900 text-[13px] text-white">{initials(m.name)}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-[15px]">{m.name}</span>
                  <span className="text-[13px] leading-normal text-soft">{m.sentBackReason}</span>
                  <span className="text-xs text-muted">
                    {g('sentTo', { name: person(m.salesId)?.name.split(' ')[0] ?? label('step', 'sales') })}
                    {m.sentBackAt && ` · ${ago(fromServer(m.sentBackAt))}`}
                  </span>
                </span>
              </Link>
            ))}
            {back.length === 0 && <p className="py-2 text-[13px] text-muted">{g('backNone')}</p>}
          </Card>

          <Card as="section" radius="rounded-tile" padding="none" className="flex flex-1 animate-rise flex-col gap-3 px-6 py-5 [animation-delay:.3s]">
            <CardHead title={g('sessionsTitle')} sub={g('sessionsSub')} to={ROUTES.calendar} label={t('overview.links.calendar')} />
            <div className="flex flex-col gap-2">
              {sessions.map((m) => {
                const days = Math.round((m.session.date - today) / 864e5)
                const soonish = days <= dueSoonDays
                return (
                  <Link
                    key={m.id}
                    to={`${memberPath(m.code)}?tab=integration`}
                    className={cx('flex items-center gap-3.5 rounded-[18px] p-2 text-ink transition-colors', soonish ? 'bg-warn-wash hover:bg-warn-bg' : 'bg-surface-2 hover:bg-surface')}
                  >
                    <span className={cx('flex size-13 shrink-0 flex-col items-center justify-center rounded-[14px]', soonish ? 'bg-warn text-white' : 'bg-panel')}>
                      <span className="text-[10px] tracking-[0.1em] uppercase opacity-80 rtl:tracking-normal">{weekdayShort(m.session.date)}</span>
                      <span className="text-xl leading-none tabular-nums">{String(m.session.date.getDate()).padStart(2, '0')}</span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm">{m.name}</span>
                      <span className="text-[13px] text-muted">
                        {back.includes(m)
                          ? g('backWith', { step: label('step', 'sales') })
                          : m.integrationDue
                            ? g('stepDue', { step: label('step', 'integration'), day: formatShort(fromDay(m.integrationDue)) })
                            : g('stepDueFirst', { step: label('step', 'integration') })}
                      </span>
                    </span>
                    <span className={cx('inline-flex h-7 w-24 shrink-0 items-center justify-center rounded-full text-xs', soonish ? cx('bg-panel', TONES.warn.text) : 'bg-surface text-soft')}>
                      {days === 0 ? t('overview.today') : days === 1 ? t('overview.tomorrow') : t('overview.inDays', { days: t('overview.counts.day', { n: days }) })}
                    </span>
                  </Link>
                )
              })}
              {sessions.length === 0 && <p className="py-4 text-[13px] text-muted">{g('sessionsNone')}</p>}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <div className="grid min-w-0 flex-[3_1_520px] grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
          <RingCard index={0} value={onTime ?? 0} total={100} color="#1f9d55" big={onTime == null ? '—' : `${onTime}%`} unit={t('overview.units.onTime')} label={g('finishedOnTime')} />
          <RingCard index={1} value={firstTest ?? 0} total={100} color="#367b7f" big={firstTest == null ? '—' : `${firstTest}%`} unit={t('overview.units.firstTest')} label={g('firstTest')} />
          <RingCard index={2} value={average ?? 0} total={aheadDays} color="#e0892b" big={average == null ? '—' : average.toFixed(1)} unit={t('overview.units.days')} label={g('averageToFinish')} />
        </div>
        <WeekChart title={g('finished')} dates={finished.map((f) => f.at)} />
      </div>

      <RecentActivity lines={week} members={mine} counters={counters(new Set(mine.map((m) => m.id))).map(([k, test]) => [g(`counters.${k}`), test])} sub={g('work')} />
    </div>
  )
}

/** A Connected / Tested state on an integration row: teal with a tick when done, grey when not, amber when waiting. */
function Pill({ on, tone, children }) {
  return (
    <span
      className={cx(
        'inline-flex h-7 w-25 shrink-0 items-center justify-center gap-1.5 rounded-full text-xs',
        tone === 'warn' ? cx(TONES.warn.fill, TONES.warn.text) : on ? 'bg-brand-100 text-brand-800' : 'bg-surface text-muted',
      )}
    >
      {on && <Icon name="check" className="size-3" strokeWidth={2.6} />}
      {children}
    </span>
  )
}
