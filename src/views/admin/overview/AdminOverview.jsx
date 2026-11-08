import { Link } from 'react-router-dom'
import { cx } from '../../../components/ui/index.js'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { teamOverview } from '../../../models/data/team.js'
import { useCounts } from '../../../controllers/shared/useCounts.js'
import { useRows } from '../../../controllers/shared/useRows.js'
import { dayKey, fromDay, fromServer, riyadhNow, startOfDay } from '../../../models/rules/format.js'
import { loadOf } from '../../../models/rules/members.js'
import { ROUTES, memberPath } from '../../../routes/paths.js'
import { addDays } from '../../../models/rules/time.js'
import { Hero } from '../../shared/overview/Hero.jsx'
import { BusyHours } from './BusyHours.jsx'
import { FreeSlots } from './FreeSlots.jsx'
import { OverviewRings } from '../../shared/overview/OverviewRings.jsx'
import { TeamNow } from './TeamNow.jsx'
import { TodayLine } from './TodayLine.jsx'
import { WorkQueue } from './WorkQueue.jsx'
import { isToday, open, thisWeek } from '../../../models/rules/when.js'

function SummaryTile({ to, label, big, sub, warn, index }) {
  return (
    <Link
      to={to}
      style={{ animationDelay: `${0.12 + index * 0.05}s` }}
      className="flex min-w-0 animate-rise flex-col gap-2.5 rounded-tile bg-panel px-6 py-5 shadow-card transition hover:-translate-y-0.75 hover:shadow-lift"
    >
      <span className="text-[13px] text-soft">{label}</span>
      <span className={cx('text-stat', warn ? 'text-warn-ink' : 'text-ink')}>{big}</span>
      <span className="truncate text-xs text-muted">{sub}</span>
    </Link>
  )
}

/**
 * The Admin's morning, as the CODEIT Lead design draws it: every open member by step, today,
 * what is waiting on whom, how busy the week is, who is free, and how the team is doing.
 */
export function AdminOverview({ members, title, sub }) {
  const { profile } = useAuth()
  const config = useConfig()
  const { label, settings, holidays, leave } = config
  const { t } = useLang()
  const q = (key) => t(`overview.admin.queue.${key}`)
  const counts = useCounts(profile.id)
  const team = useRows(teamOverview, 'team')
  const now = riyadhNow()
  const today = startOfDay(now)
  const daysTo = (day) => (day ? Math.round((fromDay(day) - today) / 864e5) : Infinity)
  const { dueSoonDays, aheadDays, recentDays } = settings

  const live = members.filter(open)
  const collecting = live.filter((m) => m.stage === 'collecting')
  const onboarding = live.filter((m) => ['setup', 'session', 'recording'].includes(m.stage))
  const late = live.filter((m) => m.late.length)
  const todays = live.filter(isToday).sort((a, b) => a.session.time.localeCompare(b.session.time))

  const people = (team.data ?? []).filter((p) => p.active && p.role !== 'admin').map((p) => ({ ...p, load: loadOf(members, p) }))
  const picked = people.filter((p) => p.load != null && !p.mustChangePassword)
  const capacity = { places: picked.length * settings.maxOpenMembers, used: picked.reduce((n, p) => n + Math.min(p.load, settings.maxOpenMembers), 0) }

  const working = (d) => settings.officeHours[d.getDay()].on && !holidays.some((h) => h.day === dayKey(d))
  const weekStart = addDays(today, -today.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter((d) => settings.officeHours[d.getDay()].on)
  const nextDays = Array.from({ length: 14 }, (_, i) => addDays(today, i + 1)).filter(working).slice(0, 3)

  const monthAgo = new Date(now - recentDays * 864e5)
  const rated = members.filter((m) => m.rating && m.ratedAt && fromServer(m.ratedAt) >= monthAgo)
  const rating = rated.length ? rated.reduce((n, m) => n + m.rating, 0) / rated.length : null
  const weekAhead = addDays(today, aheadDays + 1)
  const upNext = live
    .filter((m) => m.session && m.session.at >= now && m.session.date < weekAhead && !['recording', 'closed'].includes(m.stage))
    .sort((a, b) => a.session.at - b.session.at)

  const who = (urgent) => (m) => ({ name: m.name, urgent: urgent(m) })
  const step = (s) => `${ROUTES.members}?step=${s}`
  const groups = [
    {
      title: label('step', 'setup'),
      items: [
        { key: 'accounts', label: q('accounts'), icon: 'user', to: step('setup'), people: collecting.filter((m) => !m.accountCreatedAt).map(who((m) => daysTo(m.transferDeadline) <= dueSoonDays)) },
        {
          key: 'stuck',
          label: q('stuck'),
          icon: 'clock',
          to: step('sales'),
          people: collecting.filter((m) => m.late.includes('transfer') || m.sentBackReason || (m.noShows > 0 && !m.session)).map(who(() => true)),
        },
      ],
    },
    {
      title: label('step', 'integration'),
      items: [
        {
          key: 'integrations',
          label: q('integrations'),
          icon: 'link',
          to: step('integration'),
          people: live.filter((m) => m.stage === 'integration').map(who((m) => m.late.includes('integration') || daysTo(m.integrationDue) <= dueSoonDays)),
        },
      ],
    },
    {
      title: label('step', 'onboarding'),
      items: [
        {
          key: 'due',
          label: q('due'),
          icon: 'flag',
          to: step('onboarding'),
          people: onboarding.filter((m) => m.stage !== 'recording' && daysTo(m.setupDue) <= aheadDays).map(who((m) => m.late.includes('setup') || daysTo(m.setupDue) <= dueSoonDays)),
        },
        {
          key: 'feedback',
          label: q('feedback'),
          icon: 'star',
          to: step('onboarding'),
          // Urgent once the feedback reminder has gone and there is still no rating.
          people: onboarding
            .filter((m) => m.recordingSentAt && !m.rating)
            .map(who((m) => now - fromServer(m.recordingSentAt) >= settings.feedbackReminderHours * 36e5)),
        },
        {
          key: 'recordings',
          label: q('recordings'),
          icon: 'video',
          to: step('onboarding'),
          people: onboarding.filter((m) => m.stage === 'recording' && !m.recordingSentAt).map(who((m) => m.late.includes('recording'))),
        },
      ],
    },
    {
      title: q('team'),
      items: [
        {
          key: 'unassigned',
          label: q('unassigned'),
          icon: 'userPlus',
          to: ROUTES.members,
          people: live
            .filter((m) => m.late.includes('nobody') || (m.stage === 'collecting' && !m.accountPersonId && !m.accountCreatedAt) || (m.stage === 'integration' && !m.integrationId))
            .map(who(() => true)),
        },
        {
          key: 'leave',
          label: q('leave'),
          icon: 'calendar',
          to: ROUTES.team,
          people: people.filter((p) => p.onLeaveUntil || daysTo(p.nextLeaveFrom) <= aheadDays).map((p) => ({ name: p.name, urgent: !!p.onLeaveUntil && p.openCount > 0 })),
        },
      ],
    },
  ]

  return (
    <>
      <Hero
        title={title}
        sub={sub}
        unread={counts.unread ?? 0}
        unit={t('overview.units.open')}
        parts={[
          ['sales', '#ffffff', collecting.filter((m) => m.accountCreatedAt).length],
          ['setup', '#b8dbd9', collecting.filter((m) => !m.accountCreatedAt).length],
          ['integration', '#7fbab7', live.filter((m) => m.stage === 'integration').length],
          ['onboarding', '#4f9995', onboarding.length],
        ].map(([s, color, n]) => ({ key: s, label: label('step', s), n, color, to: `${ROUTES.members}?step=${s}` }))}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <SummaryTile
          index={0}
          to={ROUTES.calendar}
          label={t('overview.admin.today')}
          big={t('overview.counts.session', { n: todays.length })}
          sub={todays.map((m) => `${m.firstName} ${m.session.time}`).join(' · ') || t('overview.admin.nothingToday')}
        />
        <SummaryTile
          index={1}
          to={late.length === 1 ? memberPath(late[0].code) : ROUTES.members}
          label={t('overview.admin.attention')}
          big={t('overview.counts.member', { n: late.length })}
          warn={late.length > 0}
          sub={
            late.length
              ? `${late[0].firstName} · ${t(`overview.admin.late.${late[0].late[0]}`)}${late.length > 1 ? ` · ${t('overview.admin.andMore', { count: late.length - 1 })}` : ''}`
              : t('overview.admin.nothingLate')
          }
        />
        <SummaryTile
          index={2}
          to={ROUTES.team}
          label={t('overview.admin.capacity')}
          big={`${capacity.places ? Math.round((capacity.used / capacity.places) * 100) : 0}%`}
          sub={t('overview.admin.placesUsed', { used: capacity.used, places: capacity.places })}
        />
      </div>

      <TodayLine sessions={todays} />
      <WorkQueue groups={groups} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        <BusyHours days={weekDays} sessions={members.filter((m) => !m.outcome && thisWeek(m))} />
        <TeamNow people={people} />
      </div>

      <FreeSlots days={nextDays} world={{ people: team.data ?? [], members, leave, holidays, settings }} />

      <OverviewRings rating={rating} onTime={live.length ? Math.round((100 * (live.length - late.length)) / live.length) : 100} capacity={capacity} upNext={upNext} />
    </>
  )
}
