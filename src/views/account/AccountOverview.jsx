import { Link } from 'react-router-dom'
import { Badge, Card, cx, Icon, TONES } from '@/components'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { useCounts } from '../../controllers/shared/useCounts.js'
import { ago, formatShort, formatStamp, fromServer, isSameDay, riyadhNow, startOfDay, weekdayShort } from '../../models/rules/format.js'
import { ROUTES, memberPath } from '../../routes/paths.js'
import { initials, startOfWeek, workdayHours } from '../../models/rules/time.js'
import { CardHead } from '../shared/overview/CardHead.jsx'
import { Hero } from '../shared/overview/Hero.jsx'
import { IconTile } from '../shared/overview/IconTile.jsx'
import { RingCard } from '../shared/overview/OverviewRings.jsx'
import { RecentActivity } from '../shared/overview/RecentActivity.jsx'
import { WeekChart } from '../shared/overview/WeekChart.jsx'
import { open } from '../../models/rules/when.js'
import { useRecentActivity } from '../../controllers/shared/useActivity.js'

/* What Recent activity counts, from the activity lines' kind (named in account.overview.counters). */
const COUNTERS = [
  ['handedOver', (l) => l.kind === 'person_account'],
  ['created', (l) => l.kind === 'account_created'],
  ['signedIn', (l) => l.kind === 'customer_signed_in'],
  ['sentBack', (l) => l.kind === 'sent_back'],
]

/**
 * The Account Member's dashboard: their accounts as a ring (waiting, being made, made this month),
 * the oldest waiting, the ones a session needs soon, customers not signed in yet, the queue with
 * each account's progress, what was made this week, how they're doing, and this week's activity.
 */
export function AccountOverview({ members, me, title, sub }) {
  const { label, option, person, settings, active, brand } = useConfig()
  const { t } = useLang()
  const a = (key, values) => t(`account.overview.${key}`, values)
  // The parts of making an account (Settings → Lists) the Account Member ticks on the Setup tab; Confirmed is "Account created".
  const parts = active('account_part')
  const started = (m) => parts.some((o) => m.accountChecks?.[o.key])
  const { aheadDays, recentDays } = settings
  const counts = useCounts()
  const activity = useRecentActivity()
  const now = riyadhNow()
  const today = startOfDay(now)
  const weekStart = startOfWeek(today)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthAgo = new Date(now - recentDays * 864e5)
  const M = ROUTES.members

  const mine = members.filter((m) => m.accountPersonId === me)
  const todo = mine.filter((m) => open(m) && m.stage === 'collecting' && !m.accountCreatedAt).sort((a, b) => a.createdAt - b.createdAt)
  const waiting = todo.filter((m) => !started(m))
  const creating = todo.filter(started)
  const made = mine.filter((m) => m.accountCreatedAt).map((m) => ({ m, at: fromServer(m.accountCreatedAt) }))
  const madeWeek = made.filter((c) => c.at >= weekStart).sort((a, b) => b.at - a.at)
  const madeMonth = made.filter((c) => c.at >= monthStart)
  const notSignedIn = mine.filter((m) => open(m) && m.accountCreatedAt && !m.customerSignedInAt)
  const needed = todo.filter((m) => m.session).sort((a, b) => a.session.at - b.session.at)
  const oldest = todo[0]
  const daysWaiting = oldest && Math.round((today - startOfDay(oldest.createdAt)) / 864e5)

  // How they're doing, over the accounts made in the Admin's recent days.
  const recent = made.filter((c) => c.at >= monthAgo)
  const share = (test) => (recent.length ? Math.round((100 * recent.filter(test).length) / recent.length) : null)
  const sameDay = share((c) => isSameDay(c.at, c.m.createdAt))
  const signedIn = share((c) => c.m.customerSignedInAt)
  const hours = recent.length ? recent.reduce((n, c) => n + (c.at - c.m.createdAt) / 36e5, 0) / recent.length : null
  const lines = (activity.data ?? []).filter((l) => l.at >= weekStart && mine.some((m) => m.id === l.memberId))

  return (
    <div className="flex flex-col gap-4">
      <Hero
        title={title}
        sub={sub}
        unread={counts.unread ?? 0}
        unit={t('shared.overview.units.thisMonth')}
        round
        parts={[
          { key: 'waiting', label: a('parts.waiting'), n: waiting.length, color: 'var(--color-chart-warm)', to: `${M}?show=mine&step=setup` },
          { key: 'creating', label: a('parts.creating'), n: creating.length, color: 'var(--color-white)', to: `${M}?show=mine&step=setup` },
          { key: 'week', label: a('parts.week'), n: madeWeek.length, color: 'var(--color-chart-teal-1)', to: `${M}?show=mine`, ring: false },
          { key: 'month', label: a('parts.month'), n: madeMonth.length, color: 'var(--color-chart-teal-2)', to: `${M}?show=mine` },
        ]}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <IconTile id="account-overview-oldest"
          index={0}
          to={oldest ? `${memberPath(oldest.code)}?tab=setup` : `${M}?show=mine`}
          icon="clock"
          tone="warn"
          label={a('oldest')}
          big={oldest ? `${oldest.name.split(' ')[0]} · ${daysWaiting === 0 ? t('shared.overview.dayWords.today') : t('shared.overview.counts.day', { n: daysWaiting })}` : a('nobodyWaiting')}
          sub={oldest ? a('since', { when: formatStamp(oldest.createdAt) }) : a('noAccounts')}
        />
        <IconTile id="account-overview-needed"
          index={1}
          to={ROUTES.calendar}
          icon="calendar"
          tone="brand"
          label={a('needed')}
          big={t('shared.overview.counts.account', { n: needed.length })}
          sub={needed.length ? needed.slice(0, 2).map((m) => a('neededLine', { name: m.name.split(' ')[0], day: formatShort(m.session.date) })).join(' · ') : a('noneNeeded')}
        />
        <IconTile id="account-overview-not-signed-in"
          index={2}
          to={`${M}?show=mine`}
          icon="user"
          tone="indigo"
          label={a('notSignedIn')}
          big={t('shared.overview.counts.customer', { n: notSignedIn.length })}
          sub={notSignedIn.length ? a('loginSent') : a('allSignedIn')}
        />
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <Card id="account-overview-view-all" as="section" radius="rounded-tile" padding="none" className="flex min-w-0 flex-[3_1_520px] animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.2s]">
          <CardHead id="account-overview-view-all-2" title={a('queueTitle')} sub={a('queueSub', { product: brand.product })} to={`${M}?show=mine&step=setup`} label={t('shared.overview.links.viewAll')} />
          <div className="flex flex-col gap-2.5">
            {todo.map((m, i) => {
              const going = started(m)
              const site = option('business_type', m.plan)?.meta.site?.replace('https://', '')
              const steps = [...parts.map((o) => [label('account_part', o.key), !!m.accountChecks?.[o.key]]), [a('confirmed'), false]]
              return (
                <div key={m.id} style={{ animationDelay: `${0.25 + i * 0.06}s` }} className="flex animate-rise flex-col gap-3.5 rounded-3xl bg-surface-2 px-5 py-4.5">
                  <div className="flex flex-wrap items-center gap-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-900 text-[13px] text-white">{initials(m.name)}</span>
                    <span className="flex min-w-45 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] text-ink">{m.name}</span>
                      <span className="text-[13px] text-muted">
                        {[m.company, m.plan && label('business_type', m.plan)].filter(Boolean).join(' · ')}
                        {site && (
                          <>
                            {' · '}
                            <span dir="ltr">{site}</span>
                          </>
                        )}
                        {person(m.salesId) && ` · ${t('shared.overview.from', { name: person(m.salesId).name.split(' ')[0] })}`}
                      </span>
                    </span>
                    <span className={cx('inline-flex h-7 w-27.5 shrink-0 items-center justify-center rounded-full text-xs', going ? 'bg-brand-100 text-brand-800' : cx(TONES.warn.fill, TONES.warn.text))}>
                      {going ? a('creating') : a('waiting')}
                    </span>
                    <Link id={`account-overview-continue-${m.id}`}
                      to={`${memberPath(m.code)}?tab=setup`}
                      className="v-account-overview__continue inline-flex h-10 w-37.5 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm text-white transition hover:bg-brand-800 hover:text-white"
                    >
                      {going ? a('continue') : a('create')}
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {steps.map(([name, done]) => (
                      <span key={name} className="flex flex-col gap-1.5">
                        <span className={cx('h-2 rounded-full', done ? 'bg-brand-700' : 'bg-off-bar')} />
                        <span className={cx('text-xs', done ? 'text-soft' : 'text-muted')}>{name}</span>
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-muted">{going && m.accountStartedAt ? a('startedAgo', { when: ago(fromServer(m.accountStartedAt)) }) : a('addedAgo', { when: ago(m.createdAt) })}</span>
                </div>
              )
            })}
            {todo.length === 0 && <p className="py-6 text-center text-sm text-muted">{a('noAccountsToCreate')}</p>}
          </div>
        </Card>

        <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-4">
          <Card id="account-overview-made-title" as="section" radius="rounded-tile" padding="none" className="flex animate-rise flex-col gap-3 px-6 py-5 [animation-delay:.25s]">
            <div className="flex items-center gap-4">
              <span className="grid size-13 shrink-0 place-items-center rounded-[18px] bg-brand-100 text-brand-700">
                <Icon name="user" className="size-5.5" strokeWidth={1.8} />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-base text-ink">{a('madeTitle')}</span>
                <span className="text-[13px] text-muted">{madeWeek.length ? a('madeSub', { product: brand.product }) : a('madeNone')}</span>
              </span>
              <span className={cx('text-[40px] leading-none tracking-[-0.04em]', madeWeek.length ? TONES.success.text : 'text-off-ring')}>{madeWeek.length}</span>
            </div>
            {madeWeek.map(({ m, at }) => (
              <Link id={`account-overview-made-line-${m.id}`} key={m.id} to={`${memberPath(m.code)}?tab=setup`} className="v-account-overview__made-line flex flex-col rounded-2xl bg-surface-2 px-3.5 py-2.5 text-ink transition hover:bg-surface">
                <span className="text-sm">{m.name}</span>
                <span className="truncate text-xs text-muted">
                  {a('madeLine', { product: brand.product, id: m.codeitAccountId, when: formatStamp(at) })}
                </span>
              </Link>
            ))}
          </Card>

          <Card id="account-overview-calendar" as="section" radius="rounded-tile" padding="none" className="flex flex-1 animate-rise flex-col gap-3 px-6 py-5 [animation-delay:.3s]">
            <CardHead id="account-overview-calendar-2" title={a('sessionsTitle')} sub={a('sessionsSub')} to={ROUTES.calendar} label={t('shared.overview.links.calendar')} />
            <div className="flex flex-col gap-2">
              {needed.map((m) => {
                const days = Math.round((m.session.date - today) / 864e5)
                const soon = days <= aheadDays
                return (
                  <Link id={`account-overview-member-${m.id}`}
                    key={m.id}
                    to={`${memberPath(m.code)}?tab=setup`}
                    className={cx('v-account-overview__member', 'flex items-center gap-3.5 rounded-[18px] p-2 text-ink transition-colors', soon ? 'bg-warn-wash hover:bg-warn-bg' : 'bg-surface-2 hover:bg-surface')}
                  >
                    <span className={cx('flex size-13 shrink-0 flex-col items-center justify-center rounded-[14px]', soon ? 'bg-warn text-white' : 'bg-panel')}>
                      <span className="text-[10px] tracking-[0.1em] uppercase opacity-80 rtl:tracking-normal">{weekdayShort(m.session.date)}</span>
                      <span className="text-xl leading-none tabular-nums">{String(m.session.date.getDate()).padStart(2, '0')}</span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm">{m.name}</span>
                      <span className="text-[13px] text-muted">{a('accountFirst')}</span>
                    </span>
                    <Badge size="row" look={soon ? 'panelWarn' : 'surface'}>
                      {days === 0 ? t('shared.overview.today') : days === 1 ? t('shared.overview.tomorrow') : t('shared.overview.inDays', { days: t('shared.overview.counts.day', { n: days }) })}
                    </Badge>
                  </Link>
                )
              })}
              {needed.length === 0 && <p className="py-4 text-[13px] text-muted">{a('sessionsNone')}</p>}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <div className="grid min-w-0 flex-[3_1_520px] grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
          <RingCard index={0} value={sameDay ?? 0} total={100} color="var(--color-success)" big={sameDay == null ? '—' : `${sameDay}%`} unit={t('shared.overview.units.sameDay')} label={a('sameDay')} />
          <RingCard index={1} value={signedIn ?? 0} total={100} color="var(--color-brand-700)" big={signedIn == null ? '—' : `${signedIn}%`} unit={t('shared.overview.units.signedIn')} label={a('signedIn')} />
          <RingCard index={2} value={hours ?? 0} total={workdayHours(settings.officeHours) || 8} color="var(--color-warn)" big={hours == null ? '—' : hours.toFixed(1)} unit={t('shared.overview.units.hours')} label={a('averageToCreate')} />
        </div>
        <WeekChart title={a('created')} dates={made.map((c) => c.at)} />
      </div>

      <RecentActivity lines={lines} members={mine} counters={COUNTERS.map(([k, test]) => [a(`counters.${k}`), test])} sub={a('work')} />
    </div>
  )
}
