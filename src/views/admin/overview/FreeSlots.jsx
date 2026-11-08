import { Link } from 'react-router-dom'
import { Card } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { weekdayNames, monthShort } from '../../../models/rules/format.js'
import { freeAt } from '../../../models/rules/members.js'
import { ROUTES } from '../../../routes/paths.js'
import { hourSpan } from '../../../models/rules/time.js'
import { CardHead } from '../../shared/overview/CardHead.jsx'

const pad = (n) => String(n).padStart(2, '0')
const shade = (n) => (n ? `rgb(54 123 127 / ${Math.min(0.9, 0.18 + 0.24 * n)})` : 'var(--surface)')

/** Where a new session still fits on the next working days: how many Onboarding Members are free each hour. */
export function FreeSlots({ days, world }) {
  const { settings } = useConfig()
  const { t } = useLang()
  const [first, last] = hourSpan(settings.officeHours)
  const hours = Array.from({ length: last - first }, (_, i) => first + i)

  return (
    <Card id="free-slots-title" as="section" radius="rounded-tile" padding="none" className="flex animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.38s]">
      <CardHead id="free-slots-calendar" title={t('admin.overview.free.title')} sub={t('admin.overview.free.sub')} to={ROUTES.calendar} label={t('shared.overview.links.calendar')} />
      <div className="scrollbar-slim overflow-x-auto">
        <div className="grid min-w-150 items-center gap-1.5" style={{ gridTemplateColumns: `92px repeat(${hours.length}, minmax(0, 1fr))` }}>
          <span />
          {hours.map((h) => (
            <span key={h} className="text-center text-[11px] text-muted">
              {pad(h)}:00
            </span>
          ))}
          {days.map((d) => [
            <span key={`l${+d}`} className="text-[13px] font-medium text-ink">
              {weekdayNames()[d.getDay()]} {d.getDate()} {monthShort(d)}
            </span>,
            ...hours.map((h) => {
              const free = freeAt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h), world)
              return (
                <Link id={`free-slots-who-${`${+d}:${h}`}`}
                  key={`${+d}:${h}`}
                  to={ROUTES.calendar}
                  title={`${weekdayNames()[d.getDay()]} ${d.getDate()} ${monthShort(d)} · ${pad(h)}:00 · ${free.length ? t('admin.overview.free.who', { names: free.map((p) => p.name.split(' ')[0]).join(t('shared.common.listJoin')) }) : t('admin.overview.free.nobody')}`}
                  className="v-free-slots__who grid h-12 place-items-center rounded-xl text-[15px] tracking-[-0.02em] text-white transition hover:-translate-y-0.5"
                  style={{ background: shade(free.length) }}
                >
                  {free.length || ''}
                </Link>
              )
            }),
          ])}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-soft">
        <span>{t('admin.overview.free.legend')}</span>
        {[1, 2, 3, 0].map((n) => (
          <span key={n} className="flex items-center gap-1.5">
            <span className="size-4 rounded-[5px]" style={{ background: shade(n) }} />
            {n || t('admin.overview.free.none')}
          </span>
        ))}
      </div>
    </Card>
  )
}
