import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { isSameDay, weekdayNames } from '../../../models/rules/format.js'
import { ROUTES } from '../../../routes/paths.js'
import { hourSpan, toMinutes } from '../../../models/rules/time.js'
import { CardHead } from '../../shared/overview/CardHead.jsx'

const pad = (n) => String(n).padStart(2, '0')
/** A bubble grows with its sessions (4 or more is the biggest); none is a small grey dot. */
const bubble = (n) =>
  n ? { width: 14 + 6 * Math.min(n, 4), height: 14 + 6 * Math.min(n, 4), opacity: 0.55 + 0.11 * Math.min(n, 4), background: 'var(--color-brand-700)' } : { width: 6, height: 6, background: 'var(--color-chip)' }

/** This week's sessions by working day and hour, as bubbles sized by how many, with each day's total. */
export function BusyHours({ days, sessions }) {
  const { settings } = useConfig()
  const { t } = useLang()
  const sessionsOf = (n) => t('overview.counts.session', { n })
  const [first, last] = hourSpan(settings.officeHours)
  const hours = Array.from({ length: last - first }, (_, i) => first + i)
  const count = (d, h) => sessions.filter((m) => isSameDay(m.session.date, d) && Math.floor(toMinutes(m.session.time) / 60) === h).length
  const cells = days.flatMap((d) => hours.map((h) => ({ d, h, n: count(d, h) })))
  const peak = cells.reduce((best, c) => (c.n > best.n ? c : best), { n: 0 })
  const total = cells.reduce((n, c) => n + c.n, 0)
  const legend = [...new Set([1, 2, Math.min(peak.n, 4)])].filter((n) => n <= peak.n)

  return (
    <Card radius="rounded-tile" padding="none" className="flex min-w-0 animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.3s]">
      <CardHead
        title={t('overview.busy.title')}
        sub={peak.n ? t('overview.busy.peak', { when: `${weekdayNames()[peak.d.getDay()]} ${pad(peak.h)}:00`, sessions: sessionsOf(peak.n) }) : t('overview.busy.none')}
        to={ROUTES.calendar}
        label={t('overview.links.calendar')}
      />
      <div className="grid items-center gap-x-1 gap-y-1.5 text-[11px] text-muted" style={{ gridTemplateColumns: `40px repeat(${hours.length}, minmax(0, 1fr)) 30px` }}>
        <span />
        {hours.map((h) => (
          <span key={h} className="text-center">
            {pad(h)}
          </span>
        ))}
        <span className="text-end">{t('overview.busy.total')}</span>
        {days.map((d) => [
          <span key={`l${+d}`} className="text-[13px] text-soft">
            {weekdayNames()[d.getDay()]}
          </span>,
          ...hours.map((h) => {
            const n = count(d, h)
            return (
              <Link
                key={`${+d}:${h}`}
                to={ROUTES.calendar}
                title={`${weekdayNames()[d.getDay()]} ${pad(h)}:00 · ${sessionsOf(n)}`}
                className="grid h-10 place-items-center rounded-xl transition-colors hover:bg-field"
              >
                <span className="rounded-full" style={bubble(n)} />
              </Link>
            )
          }),
          <span key={`t${+d}`} className="text-end text-[13px] text-ink tabular-nums">
            {hours.reduce((n, h) => n + count(d, h), 0)}
          </span>,
        ])}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-4 text-xs text-soft">
        <span>{t('overview.busy.thisWeek', { sessions: sessionsOf(total) })}</span>
        <span className="flex-1" />
        {legend.map((n) => (
          <span key={n} className="flex items-center gap-1.5">
            <span className="rounded-full" style={bubble(n)} />
            {n}
          </span>
        ))}
      </div>
    </Card>
  )
}
