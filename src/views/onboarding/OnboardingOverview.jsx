import { Link } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'
import { Button, Card, cx } from '../../components/ui/index.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { joinSession } from '../../models/data/actions.js'
import { listRecentActivity } from '../../models/data/members.js'
import { useCopy } from '../../controllers/shared/useCopy.js'
import { useCounts } from '../../controllers/shared/useCounts.js'
import { useRows } from '../../controllers/shared/useRows.js'
import { formatShort, fromDay, fromServer, isSameDay, riyadhNow, startOfDay } from '../../models/rules/format.js'
import { ROUTES, memberPath } from '../../routes/paths.js'
import { addDays, initials } from '../../models/rules/time.js'
import { TONES } from '../../components/tones.js'
import { CardHead } from '../shared/overview/CardHead.jsx'
import { Hero } from '../shared/overview/Hero.jsx'
import { RingCard } from '../shared/overview/OverviewRings.jsx'
import { RecentActivity } from '../shared/overview/RecentActivity.jsx'
import { WeekChart } from '../shared/overview/WeekChart.jsx'
import { dayDate, open } from '../../models/rules/when.js'

/* What Recent activity counts, from the activity lines' kind (named in overview.onboarding.counters). */
const COUNTERS = [
  ['sessions', (l) => l.kind === 'completed'],
  ['checklists', (l) => l.kind === 'setup_done'],
  ['recordings', (l) => l.kind === 'recording_sent'],
  ['ratings', (l) => l.kind === 'rating'],
]
const minuteOf = (d) => Math.floor(d / 6e4)

/**
 * The Onboarding Member's dashboard: this month's sessions as a ring (today, later this week, the
 * rest), the next session with its Meet link and checklist, checklists to finish, recordings to send,
 * how they're doing (rating, started on time, recordings sent within the Admin's alert hours), sessions held, and this week.
 */
export function OnboardingOverview({ members, me, title, sub }) {
  const { active, label, settings } = useConfig()
  const { t } = useLang()
  const o = (key, values) => t(`overview.onboarding.${key}`, values)
  const { recentDays, recordingAlertHours } = settings
  const counts = useCounts(me)
  const copy = useCopy()
  const activity = useRows(() => listRecentActivity(new Date(Date.now() - recentDays * 864e5).toISOString()), `activity:${recentDays}d`)
  const now = riyadhNow()
  const today = startOfDay(now)
  const weekStart = addDays(today, -today.getDay())
  const weekEnd = addDays(weekStart, 7)
  const monthAgo = new Date(now - recentDays * 864e5)
  const checks = active('setup_check')
  const M = ROUTES.members
  const day = (d) => {
    const n = Math.round((startOfDay(d) - today) / 864e5)
    return n === 0 ? t('overview.dayWords.today') : n === 1 ? t('overview.dayWords.tomorrow') : n === -1 ? t('overview.dayWords.yesterday') : formatShort(d)
  }

  const mine = members.filter((m) => m.onboardingId === me)
  const booked = mine.filter((m) => !m.outcome && m.session).sort((a, b) => a.session.at - b.session.at)
  const month = booked.filter((m) => m.session.date.getMonth() === now.getMonth() && m.session.date.getFullYear() === now.getFullYear())
  const todays = month.filter((m) => isSameDay(m.session.date, now))
  const later = booked.filter((m) => m.session.date > today && m.session.date < weekEnd && !isSameDay(m.session.date, now))
  const upcoming = booked.filter((m) => ['setup', 'session'].includes(m.stage) && Date.parse(m.sessionEndsAt) >= Date.now())
  const next = upcoming[0]
  const setups = mine.filter((m) => open(m) && m.stage === 'setup').sort((a, b) => (a.setupDue ?? '9').localeCompare(b.setupDue ?? '9'))
  const recordings = mine.filter((m) => open(m) && m.stage === 'recording' && !m.recordingSentAt)
  const left = (m) => checks.filter((c) => !m.setupChecks?.[c.key])
  /** What is left of a checklist, as a lower-case list ("staff users created, …"). */
  const leftList = (m) => left(m).map((c) => label('setup_check', c.key).toLowerCase()).join(t('overview.sep'))

  // How they're doing, over the Admin's recent days.
  const rated = mine.filter((m) => m.rating && m.ratedAt && fromServer(m.ratedAt) >= monthAgo)
  const rating = rated.length ? rated.reduce((n, m) => n + m.rating, 0) / rated.length : null
  const held = mine.filter((m) => m.completedAt && fromServer(m.completedAt) >= monthAgo)
  const joined = held.filter((m) => m.sessionJoinedAt)
  const onTime = joined.length ? Math.round((100 * joined.filter((m) => minuteOf(Date.parse(m.sessionJoinedAt)) <= minuteOf(Date.parse(m.sessionAt))).length) / joined.length) : null
  const sent = mine.filter((m) => m.recordingSentAt && m.completedAt && fromServer(m.recordingSentAt) >= monthAgo)
  const inADay = sent.length ? Math.round((100 * sent.filter((m) => Date.parse(m.recordingSentAt) - Date.parse(m.completedAt) <= recordingAlertHours * 36e5).length) / sent.length) : null
  const lines = (activity.data ?? []).filter((l) => l.at >= weekStart && mine.some((m) => m.id === l.memberId))

  const startsIn = next && Math.round((next.session.at - now) / 6e4)
  const when = !next
    ? ''
    : startsIn <= 0
      ? o('sessionNow')
      : isSameDay(next.session.date, now)
        ? o('next', { when: startsIn >= 60 ? o('inHoursMinutes', { hours: Math.floor(startsIn / 60), minutes: startsIn % 60 }) : o('inMinutes', { minutes: startsIn }) })
        : o('next', { when: day(next.session.date) })

  return (
    <div className="flex flex-col gap-4">
      <Hero
        title={title}
        sub={sub}
        unread={counts.unread ?? 0}
        unit={t('overview.units.sessionsThisMonth')}
        round
        parts={[
          { key: 'today', label: o('parts.today'), n: todays.length, color: '#ffffff', to: ROUTES.calendar },
          { key: 'later', label: o('parts.later'), n: later.length, color: '#b8dbd9', to: ROUTES.calendar },
          { key: 'checklists', label: o('parts.checklists'), n: setups.length, color: '#e9b27a', to: `${M}?show=mine&step=onboarding`, ring: false },
          { key: 'recordings', label: o('parts.recordings'), n: recordings.length, color: '#f3a8a0', to: `${M}?show=mine&step=onboarding`, ring: false },
          {
            key: 'rest',
            label: o('parts.rest'),
            n: month.length - todays.length - later.filter((m) => m.session.date.getMonth() === now.getMonth()).length,
            color: '#7fbab7',
            to: ROUTES.calendar,
            tile: false,
          },
        ]}
      />

      <div className="flex flex-wrap items-stretch gap-4">
        <Card as="section" radius="rounded-tile" padding="none" className="flex min-w-0 flex-[3_1_520px] animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.2s]">
          <CardHead title={o('todayTitle')} sub={o('todaySub')} to={ROUTES.calendar} label={t('overview.links.calendar')} />
          {next ? (
            <div className="flex flex-col gap-4 rounded-[26px] bg-brand-700 p-6 text-white">
              <div className="flex items-start justify-between gap-3">
                <span className="flex flex-col gap-1">
                  <span className="text-xs tracking-[0.14em] text-[#cfe5e4] uppercase rtl:tracking-normal">{when}</span>
                  <span className="text-stat leading-none">{next.session.time}</span>
                </span>
                {next.meetLink && (
                  <Button
                    variant="bare"
                    aria-label={o('copyMeet')}
                    title={o('copyMeet')}
                    onClick={() => copy(next.meetLink, o('meetCopied'))}
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-white/16 text-white transition hover:bg-white/26"
                  >
                    <Icon name="copy" className="size-4" strokeWidth={1.8} />
                  </Button>
                )}
              </div>
              <Link to={`${memberPath(next.code)}?tab=onboarding`} className="text-base text-white hover:text-white">
                {next.name}
                <span className="text-[#cfe5e4]"> · {[next.company, next.plan && label('business_type', next.plan)].filter(Boolean).join(' · ')}</span>
              </Link>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <span className="grid min-w-0 flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${checks.length}, minmax(0, 1fr))` }}>
                    {checks.map((c) => (
                      <span key={c.key} title={label('setup_check', c.key)} className={cx('h-1.5 rounded-full', next.setupChecks?.[c.key] ? 'bg-white' : 'bg-white/25')} />
                    ))}
                  </span>
                  {next.meetLink && (
                    <a
                      href={next.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => joinSession(next.id).catch(() => {})}
                      className="inline-flex h-11 w-37.5 shrink-0 items-center justify-center gap-2 rounded-full bg-white text-sm text-brand-700 transition hover:bg-brand-100 hover:text-brand-700"
                    >
                      <Icon name="video" className="size-4" strokeWidth={1.8} />
                      {o('joinMeet')}
                    </a>
                  )}
                </div>
                <span className="text-xs text-[#cfe5e4]">
                  {o('checklist', { done: checks.length - left(next).length, total: checks.length })}
                  {` · ${left(next).length ? o('left', { list: leftList(next) }) : o('ready')}`}
                </span>
              </div>
            </div>
          ) : (
            <p className="rounded-[26px] bg-surface-2 py-8 text-center text-sm text-muted">{o('noneComing')}</p>
          )}
          {later.filter((m) => m !== next).length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="eyebrow text-faint rtl:tracking-normal">{o('laterThisWeek')}</span>
              {later
                .filter((m) => m !== next)
                .map((m) => (
                  <Link key={m.id} to={`${memberPath(m.code)}?tab=onboarding`} className="flex items-center gap-3.5 rounded-[18px] bg-surface-2 px-3 py-2.5 text-ink transition hover:bg-surface">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-900 text-[11px] text-white">{initials(m.name)}</span>
                    <span className="flex-1 truncate text-sm">{m.name}</span>
                    <span className="text-[13px] text-muted tabular-nums">
                      {dayDate(m.session.date)} · {m.session.time}
                    </span>
                  </Link>
                ))}
            </div>
          )}
        </Card>

        <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-4">
          <Card as="section" radius="rounded-tile" padding="none" className="flex animate-rise flex-col gap-3 px-6 py-5 [animation-delay:.25s]">
            <CardHead
              title={o('setupTitle')}
              sub={o('setupSub', { days: t('overview.counts.workingDay', { n: settings.setupDueDays }) })}
              to={`${M}?show=mine&step=onboarding`}
              label={t('overview.links.viewAll')}
            />
            {setups.map((m) => {
              const due = m.setupDue && fromDay(m.setupDue)
              const urgent = due && due <= today
              const done = checks.length - left(m).length
              return (
                <Link key={m.id} to={`${memberPath(m.code)}?tab=onboarding`} className={cx('flex flex-col gap-3 rounded-[22px] px-4.5 py-4 text-ink transition-colors', urgent ? 'bg-warn-wash hover:bg-warn-bg' : 'bg-surface-2 hover:bg-surface')}>
                  <span className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-900 text-[11px] text-white">{initials(m.name)}</span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-sm">{m.name}</span>
                      <span className={cx('text-xs', urgent ? TONES.warn.text : 'text-muted')}>
                        {due ? o('due', { day: day(due) }) : o('noDueDate')}
                        {m.session && ` · ${o('sessionAt', { when: `${day(m.session.date)} ${m.session.time}` })}`}
                      </span>
                    </span>
                    <span className="text-sm tabular-nums">
                      {done}/{checks.length}
                    </span>
                  </span>
                  <span className="grid gap-1" style={{ gridTemplateColumns: `repeat(${checks.length}, minmax(0, 1fr))` }}>
                    {checks.map((c) => (
                      <span key={c.key} className={cx('h-2 rounded-full', m.setupChecks?.[c.key] ? 'bg-brand-700' : 'bg-[#f3d6b3]')} />
                    ))}
                  </span>
                  {left(m).length > 0 && <span className="text-[13px] text-soft">{o('leftList', { list: leftList(m) })}</span>}
                </Link>
              )
            })}
            {setups.length === 0 && <p className="py-2 text-[13px] text-muted">{o('setupNone')}</p>}
          </Card>

          <Card as="section" radius="rounded-tile" padding="none" className="flex flex-1 animate-rise flex-col gap-3 px-6 py-5 [animation-delay:.3s]">
            <CardHead title={o('recordingsTitle')} sub={o('recordingsSub')} to={`${M}?show=mine&step=onboarding`} label={t('overview.links.viewAll')} />
            {recordings.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-[22px] bg-surface-2 px-4 py-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-900 text-[11px] text-white">{initials(m.name)}</span>
                <span className="flex min-w-35 flex-1 flex-col">
                  <span className="text-sm text-ink">{m.name}</span>
                  <span className="text-xs text-muted">{m.session ? o('sessionOn', { day: formatShort(m.session.date), time: m.session.time }) : o('sessionHeld')}</span>
                </span>
                <Link
                  to={`${memberPath(m.code)}?tab=onboarding`}
                  className="inline-flex h-10 w-32.5 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand-700 text-[13px] text-white transition hover:bg-brand-800 hover:text-white"
                >
                  <Icon name="link" className="size-3.5" strokeWidth={1.8} />
                  {o('addLink')}
                </Link>
              </div>
            ))}
            {recordings.length === 0 && <p className="py-2 text-[13px] text-muted">{o('recordingsNone')}</p>}
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <div className="grid min-w-0 flex-[3_1_520px] grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
          <RingCard index={0} value={rating ?? 0} total={5} color="#1f9d55" big={rating == null ? '—' : rating.toFixed(1)} unit={t('overview.units.rating')} label={t('overview.rings.clientRating', { days: t('overview.lastDays', { n: recentDays }) })} />
          <RingCard index={1} value={onTime ?? 0} total={100} color="#367b7f" big={onTime == null ? '—' : `${onTime}%`} unit={t('overview.units.onTime')} label={o('startedOnTime')} />
          <RingCard index={2} value={inADay ?? 0} total={100} color="#e0892b" big={inADay == null ? '—' : `${inADay}%`} unit={t('overview.units.inHours', { hours: recordingAlertHours })} label={o('sentIn', { hours: recordingAlertHours })} />
        </div>
        <WeekChart title={o('held')} dates={mine.filter((m) => m.completedAt).map((m) => fromServer(m.completedAt))} />
      </div>

      <RecentActivity lines={lines} members={mine} counters={COUNTERS.map(([k, test]) => [o(`counters.${k}`), test])} sub={o('work')} />
    </div>
  )
}
