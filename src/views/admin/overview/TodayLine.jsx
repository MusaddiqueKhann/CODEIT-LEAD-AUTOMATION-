import { Link } from 'react-router-dom'
import { Card, cx } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { weekdayNames, monthShort, riyadhNow } from '../../../models/rules/format.js'
import { ROUTES, memberPath } from '../../../routes/paths.js'
import { statusOf } from '../../../models/rules/stages.js'
import { hourSpan, initials, toMinutes } from '../../../models/rules/time.js'
import { CardHead } from '../../shared/overview/CardHead.jsx'

const pad = (n) => String(n).padStart(2, '0')

/**
 * Today on one line across the working hours: a pin per session with who runs it, the line filled
 * up to now, and an amber mark at now. ponytail: two sessions within the same hour sit on top of
 * each other; stagger them if that starts happening.
 */
export function TodayLine({ sessions }) {
  const { label, person, settings } = useConfig()
  const { t } = useLang()
  const now = riyadhNow()
  const [first, last] = hourSpan(settings.officeHours)
  const span = (last - first) * 60
  const at = (minutes) => Math.min(100, Math.max(0, ((minutes - first * 60) / span) * 100))
  const nowAt = at(now.getHours() * 60 + now.getMinutes())

  return (
    <Card radius="rounded-tile" padding="none" className="flex animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.24s]">
      <CardHead id="today-line-calendar"
        title={t('admin.overview.todayLine.title', { day: `${weekdayNames()[now.getDay()]} ${now.getDate()} ${monthShort(now)}` })}
        sub={`${t('shared.overview.counts.session', { n: sessions.length })} · ${t('shared.overview.nowAt', { time: `${pad(now.getHours())}:${pad(now.getMinutes())}` })}`}
        to={ROUTES.calendar}
        label={t('shared.overview.links.calendar')}
      />
      <div className="relative mx-2 h-24">
        <div className="absolute inset-x-0 top-11 h-1.5 rounded-full bg-track" />
        <div className="absolute start-0 top-11 h-1.5 rounded-full bg-linear-to-r from-brand-glow-from to-brand-glow-to transition-[width] rtl:bg-linear-to-l" style={{ width: `${nowAt}%` }} />
        <div className="absolute inset-x-0 top-15.5 flex justify-between text-[11px] text-muted">
          {Array.from({ length: last - first + 1 }, (_, i) => (
            <span key={i}>{pad(first + i)}:00</span>
          ))}
        </div>
        {sessions.map((m, i) => {
          const x = at(toMinutes(m.session.time))
          const holder = person(m.holderId)
          return (
            <Link id={`today-line-member-${m.id}`}
              key={m.id}
              to={memberPath(m.code)}
              style={{ insetInlineStart: `${x}%`, animationDelay: `${0.6 + i * 0.12}s` }}
              className={cx('v-today-line__member', 'absolute top-0 flex animate-rise flex-col items-center gap-1.5 text-ink', x < 12 ? 'items-start' : x > 88 ? '-translate-x-full items-end rtl:translate-x-full' : '-translate-x-1/2 rtl:translate-x-1/2')}
            >
              <span className="flex h-8 items-center gap-2 rounded-full bg-tint ps-1 pe-3 text-xs whitespace-nowrap">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-900 text-[10px] text-white">{holder ? initials(holder.name) : '?'}</span>
                {m.session.time} {m.firstName} · {label('step', statusOf(m))}
              </span>
              <span className="size-3 rounded-full bg-brand-700 ring-4 ring-brand-150" />
            </Link>
          )
        })}
        {nowAt > 0 && nowAt < 100 && <span className="absolute top-9 h-5.5 w-0.5 rounded-full bg-warn" style={{ insetInlineStart: `${nowAt}%` }} />}
        {sessions.length === 0 && <span className="absolute inset-x-0 top-2 text-center text-[13px] text-muted">{t('admin.overview.todayLine.none')}</span>}
      </div>
    </Card>
  )
}
