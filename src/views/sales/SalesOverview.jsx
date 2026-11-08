import { Link } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'
import { Card, cx } from '../../components/ui/index.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { listRecentActivity } from '../../models/data/members.js'
import { useCounts } from '../../controllers/shared/useCounts.js'
import { useRows } from '../../controllers/shared/useRows.js'
import { fromDay, isSameDay, riyadhNow, startOfDay, weekdayShort } from '../../models/rules/format.js'
import { ROUTES, memberPath } from '../../routes/paths.js'
import { addDays } from '../../models/rules/time.js'
import { TONES } from '../../components/tones.js'
import { CardHead } from '../shared/overview/CardHead.jsx'
import { CollectingCard } from './CollectingCard.jsx'
import { Hero } from '../shared/overview/Hero.jsx'
import { IconTile } from '../shared/overview/IconTile.jsx'
import { RingCard } from '../shared/overview/OverviewRings.jsx'
import { RecentActivity } from '../shared/overview/RecentActivity.jsx'
import { WeekChart } from '../shared/overview/WeekChart.jsx'
import { dayDate, open, thisWeek } from '../../models/rules/when.js'

const CUSTOMER = ['documents', 'hardware'] // the checks waiting on the customer
/* What Recent activity counts, from the activity lines' kind (named in overview.sales.counters). */
const COUNTERS = [
  ['files', (l) => l.kind === 'document_uploaded'],
  ['sessions', (l) => l.kind === 'session' || l.kind === 'no_show'],
  ['transfers', (l) => l.kind === 'transferred'],
  ['notes', (l) => l.kind === 'note'],
  ['done', (l) => l.kind === 'completed' || l.kind === 'account_created'],
]

/**
 * Sales' dashboard: their members as a ring by where each is, today's sessions, what is due soon
 * and waiting on the customer, a card per member still collecting, what came back, this week's
 * sessions, how they're doing (transfer rate, on time, days to transfer, members added) and what
 * happened this week.
 */
export function SalesOverview({ members, me, title, sub }) {
  const { person, settings } = useConfig()
  const { t } = useLang()
  const s = (key, values) => t(`overview.sales.${key}`, values)
  const withRunner = (m) => (person(m.onboardingId) ? t('overview.with', { name: person(m.onboardingId).name.split(' ')[0] }) : null)
  const { aheadDays, recentDays } = settings
  const counts = useCounts(me)
  const activity = useRows(() => listRecentActivity(new Date(Date.now() - recentDays * 864e5).toISOString()), `activity:${recentDays}d`)
  const now = riyadhNow()
  const today = startOfDay(now)
  const daysTo = (key) => Math.round((fromDay(key) - today) / 864e5)

  const mine = members.filter((m) => m.salesId === me)
  const live = mine.filter(open)
  const collecting = live.filter((m) => m.stage === 'collecting')
  const back = collecting.filter((m) => m.sentBackReason || (m.noShows > 0 && !m.session))
  const ready = collecting.filter((m) => m.ready?.ok && !back.includes(m))
  const moved = live.filter((m) => m.stage !== 'collecting')
  const todays = live.filter((m) => m.session && isSameDay(m.session.date, now)).sort((a, b) => a.session.time.localeCompare(b.session.time))
  const dueSoon = collecting
    .filter((m) => m.transferDeadline && !m.late.includes('transfer') && daysTo(m.transferDeadline) <= aheadDays)
    .sort((a, b) => a.transferDeadline.localeCompare(b.transferDeadline))
  const waiting = CUSTOMER.map((k) => [k, collecting.filter((m) => !m.ready?.[k]).length])
  const week = mine.filter(thisWeek).sort((a, b) => a.session.at - b.session.at)

  // How they're doing: the Admin's recent days.
  const monthAgo = new Date(now - recentDays * 864e5)
  const recent = mine.filter((m) => m.createdAt >= monthAgo)
  const transferred = recent.filter((m) => m.stage !== 'collecting').length
  const decided = transferred + recent.filter((m) => m.outcome === 'lost').length
  const rate = decided ? Math.round((100 * transferred) / decided) : null
  const onTime = live.length ? Math.round((100 * live.filter((m) => !m.late.length).length) / live.length) : 100
  const byId = new Map(mine.map((m) => [m.id, m]))
  const lines = (activity.data ?? []).filter((l) => byId.has(l.memberId))
  const took = lines
    .filter((l) => l.kind === 'transferred')
    .map((l) => (l.at - byId.get(l.memberId).createdAt) / 864e5)
  const average = took.length ? took.reduce((a, b) => a + b, 0) / took.length : null
  const weekStart = addDays(today, -today.getDay())

  return (
    <div className="flex flex-col gap-4">
      <Hero
        title={title}
        sub={sub}
        unread={counts.unread ?? 0}
        unit={t('overview.units.myMembers')}
        round
        parts={[
          { key: 'collecting', label: s('parts.collecting'), n: collecting.length - ready.length - back.length, color: '#ffffff', to: `${ROUTES.members}?show=mine&step=sales` },
          { key: 'ready', label: s('parts.ready'), n: ready.length, color: '#b8dbd9', to: `${ROUTES.members}?show=mine&step=sales` },
          { key: 'back', label: s('parts.back'), n: back.length, color: '#e9b27a', to: `${ROUTES.members}?show=mine&step=sales` },
          { key: 'moved', label: s('parts.moved'), n: moved.length, color: '#7fbab7', to: `${ROUTES.members}?show=mine` },
        ]}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <IconTile
          index={0}
          to={ROUTES.calendar}
          icon="calendar"
          tone="brand"
          label={s('today')}
          big={t('overview.counts.session', { n: todays.length })}
          sub={todays.length ? todays.slice(0, 2).map((m) => `${m.name} · ${m.session.time}${withRunner(m) ? ` ${withRunner(m)}` : ''}`).join(' · ') : s('noSessionsToday')}
        />
        <IconTile
          index={1}
          to={dueSoon.length === 1 ? memberPath(dueSoon[0].code) : `${ROUTES.members}?show=mine&step=sales`}
          icon="clock"
          tone="warn"
          label={s('dueSoon')}
          big={t('overview.counts.member', { n: dueSoon.length })}
          sub={dueSoon.length ? dueSoon.slice(0, 3).map((m) => s('dueBy', { name: m.name.split(' ')[0], day: dayDate(fromDay(m.transferDeadline)) })).join(' · ') : s('noTransferDue')}
        />
        <IconTile
          index={2}
          to={`${ROUTES.members}?show=mine&step=sales`}
          icon="file"
          tone="indigo"
          label={s('waiting')}
          big={t('overview.counts.item', { n: waiting.reduce((n, [, c]) => n + c, 0) })}
          sub={
            waiting
              .filter(([, c]) => c)
              .map(([k], i) => (i ? t(`overview.checks.${k}`).toLowerCase() : t(`overview.checks.${k}`)))
              .join(t('overview.sep')) || s('nothingOutstanding')
          }
        />
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <Card as="section" radius="rounded-tile" padding="none" className="flex min-w-0 flex-[3_1_520px] animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.2s]">
          <CardHead title={s('collectingTitle')} sub={s('collectingSub')} to={`${ROUTES.members}?show=mine&step=sales`} label={t('overview.links.viewAll')} />
          {collecting.length ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
              {collecting.map((m, i) => (
                <CollectingCard key={m.id} member={m} index={i} />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">{s('nobodyCollecting')}</p>
          )}
        </Card>

        <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-4">
          <Card as="section" radius="rounded-tile" padding="none" className="flex animate-rise flex-col gap-3 px-6 py-5 [animation-delay:.25s]">
            <div className="flex items-center gap-4">
              <span className={cx('grid size-13 shrink-0 place-items-center rounded-[18px]', back.length ? cx(TONES.warn.fill, TONES.warn.text) : 'bg-brand-100 text-brand-700')}>
                <Icon name={back.length ? 'refresh' : 'check'} className="size-5.5" strokeWidth={2.2} />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-base text-ink">{s('backTitle')}</span>
                <span className="text-[13px] text-muted">{back.length ? s('backSub') : s('backNone')}</span>
              </span>
              <span className={cx('text-[40px] leading-none tracking-[-0.04em]', back.length ? TONES.warn.text : 'text-[#c9d0d8]')}>{back.length}</span>
            </div>
            {back.map((m) => (
              <Link
                key={m.id}
                to={`${memberPath(m.code)}?tab=sales${m.sentBackReason ? '' : '#pick-time'}`}
                className="flex flex-col rounded-2xl bg-surface-2 px-3.5 py-2.5 text-ink transition hover:bg-surface"
              >
                <span className="text-sm">{m.name}</span>
                <span className="truncate text-xs text-muted">
                  {m.sentBackReason ? `${person(m.sentBackBy)?.name ?? t('overview.someone')}: ${m.sentBackReason}` : t('overview.missedBookNew')}
                </span>
              </Link>
            ))}
          </Card>

          <Card as="section" radius="rounded-tile" padding="none" className="flex flex-1 animate-rise flex-col gap-3 px-6 py-5 [animation-delay:.3s]">
            <CardHead title={s('weekTitle')} sub={s('weekSub')} to={ROUTES.calendar} label={t('overview.links.calendar')} />
            <div className="flex flex-col gap-2">
              {week.map((m) => {
                const isToday = isSameDay(m.session.date, now)
                return (
                  <Link
                    key={m.id}
                    to={memberPath(m.code)}
                    className={cx('flex items-center gap-3.5 rounded-[18px] p-2 text-ink transition-colors', isToday ? 'bg-brand-100 hover:bg-[#e1efef]' : 'bg-surface-2 hover:bg-surface')}
                  >
                    <span className={cx('flex size-13 shrink-0 flex-col items-center justify-center rounded-[14px]', isToday ? 'bg-brand-700 text-white' : 'bg-panel')}>
                      <span className="text-[10px] tracking-[0.1em] uppercase opacity-75 rtl:tracking-normal">{weekdayShort(m.session.date)}</span>
                      <span className="text-xl leading-none tabular-nums">{String(m.session.date.getDate()).padStart(2, '0')}</span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm">{m.name}</span>
                      <span className="text-[13px] text-muted">
                        {m.session.time} · {withRunner(m) ?? s('nobodyPicked')}
                      </span>
                    </span>
                    <span
                      className={cx(
                        'inline-flex h-7 shrink-0 items-center rounded-full px-3 text-xs',
                        m.completedAt ? cx(TONES.success.fill, TONES.success.text) : isToday ? cx('bg-panel', TONES.success.text) : 'bg-panel text-soft',
                      )}
                    >
                      {t(`overview.status.${m.completedAt ? 'done' : isToday ? 'today' : m.session.date < today ? 'missed' : 'upcoming'}`)}
                    </span>
                  </Link>
                )
              })}
              {week.length === 0 && <p className="py-4 text-[13px] text-muted">{s('weekNone')}</p>}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <div className="grid min-w-0 flex-[3_1_520px] grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
          <RingCard index={0} value={rate ?? 0} total={100} color="#1f9d55" big={rate == null ? '—' : `${rate}%`} unit={t('overview.units.transferred')} label={s('transferRate', { days: t('overview.lastDays', { n: recentDays }) })} />
          <RingCard index={1} value={onTime} total={100} color="#367b7f" big={`${onTime}%`} unit={t('overview.units.onTime')} label={s('readyOnTime')} />
          <RingCard index={2} value={average ?? 0} total={aheadDays} color="#e0892b" big={average == null ? '—' : average.toFixed(1)} unit={t('overview.units.days')} label={s('averageToTransfer')} />
        </div>
        <WeekChart title={s('membersAdded')} dates={members.filter((m) => m.createdBy === me).map((m) => m.createdAt)} />
      </div>

      <RecentActivity lines={lines.filter((l) => l.at >= weekStart)} members={mine} counters={COUNTERS.map(([k, test]) => [s(`counters.${k}`), test])} />
    </div>
  )
}
