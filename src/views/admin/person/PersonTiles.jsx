import { StatTile } from '../../../components/shared/index.js'
import { Badge } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { dayKey, formatShort, fromServer, riyadhNow, startOfDay } from '../../../models/rules/format.js'
import { stepOfStage } from '../../../models/rules/stages.js'
import { thisWeek } from '../../../models/rules/week.js'

/** Four numbers about a person: open members, sessions this week, the next session, ratings. */
export function PersonTiles({ person, open, all }) {
  const { label, settings } = useConfig()
  const { t } = useLang()
  const now = riyadhNow()
  const week = thisWeek().map(dayKey)

  const bySteps = Object.entries(Object.groupBy(open, (m) => stepOfStage(m.stage))).map(([s, list]) => [label('step', s), list.length])
  const stepsLine =
    bySteps.length === 0
      ? t('person.tiles.nothingOpen')
      : bySteps.length === 1 && open.length > 1
        ? t('person.tiles.allIn', { n: open.length, step: bySteps[0][0] })
        : bySteps.map(([s, n]) => t('person.tiles.nIn', { n, step: s })).join(' · ')

  const booked = open.filter((m) => m.session).sort((a, b) => a.session.at - b.session.at)
  const thisWeeks = booked.filter((m) => week.includes(dayKey(m.session.date)))
  const next = booked.find((m) => m.session.at >= now)
  const days = next && Math.round((startOfDay(next.session.date) - startOfDay(now)) / 864e5)

  const month = (d) => d.getFullYear() * 12 + d.getMonth()
  const rated = all.filter((m) => m.rating && m.ratedAt && Object.values(m.people).includes(person.id) && month(fromServer(m.ratedAt)) === month(now))
  const average = rated.length ? rated.reduce((s, m) => s + m.rating, 0) / rated.length : null

  const tiles = [
    {
      title: t('person.tiles.open'),
      aside: <Badge size="sm" tone="brand">{t('person.tiles.now')}</Badge>,
      big: open.length,
      unit: t('person.tiles.member', { n: open.length }),
      sub: stepsLine,
    },
    {
      title: t('person.tiles.thisWeek'),
      aside: <Badge size="sm" tone="brand">{t('person.tiles.booked')}</Badge>,
      big: thisWeeks.length,
      unit: t('person.tiles.session', { n: thisWeeks.length }),
      sub: thisWeeks.length ? thisWeeks.map((m) => formatShort(m.session.date)).join(' · ') : t('person.tiles.nothingWeek'),
    },
    {
      title: t('person.tiles.next'),
      aside: next && (
        <Badge size="sm" tone={days <= settings.dueSoonDays ? 'warn' : 'brand'}>
          {days <= settings.dueSoonDays ? t('person.tiles.soon') : t('person.tiles.booked')}
        </Badge>
      ),
      big: next ? (days === 0 ? t('person.tiles.today') : days) : '—',
      unit: next && days > 0 ? t('person.tiles.day', { n: days }) : null,
      sub: next ? `${formatShort(next.session.date)} · ${next.session.time} · ${next.firstName}` : t('person.tiles.nothingBooked'),
    },
    {
      title: t('person.tiles.feedback'),
      aside: <Badge size="sm" tone="neutral">{t('person.tiles.clients')}</Badge>,
      big: average == null ? '—' : average.toFixed(1),
      unit: average == null ? null : '/ 5',
      sub: rated.length ? t('person.tiles.fromClients', { n: rated.length }) : t('person.tiles.noRatings'),
    },
  ]

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      {tiles.map((tile, i) => (
        <StatTile key={tile.title} index={i} {...tile} />
      ))}
    </div>
  )
}
