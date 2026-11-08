import { Link } from 'react-router-dom'
import { StepBadge } from '../../../components/shared/index.js'
import { Card, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { weekdayShort } from '../../../models/rules/format.js'
import { ROUTES, memberPath } from '../../../routes/paths.js'
import { CardHead } from './CardHead.jsx'
import { Ring } from './Ring.jsx'

export function RingCard({ value, total, color, big, unit, label, index }) {
  return (
    <Card radius="rounded-tile" padding="none" style={{ animationDelay: `${0.4 + index * 0.05}s` }} className="flex animate-rise flex-col items-center justify-center gap-3 px-5 py-5">
      <Ring size={116} stroke={12} total={total} track="#f1f4f7" round parts={[{ value, color }]}>
        <span className="text-[26px] leading-none tracking-[-0.04em] text-ink">{big}</span>
        <span className="mt-1 text-[11px] text-muted">{unit}</span>
      </Ring>
      <span className="text-[13px] text-soft">{label}</span>
    </Card>
  )
}

/** The bottom row: client rating, members on time, team capacity, and every session coming up (the Admin's days ahead). */
export function OverviewRings({ rating, onTime, capacity, upNext }) {
  const { settings } = useConfig()
  const { t } = useLang()
  const days = t('overview.counts.day', { n: settings.aheadDays })
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
      <RingCard index={0} value={rating ?? 0} total={5} color="#1f9d55" big={rating == null ? '—' : rating.toFixed(1)} unit={t('overview.units.rating')} label={t('overview.rings.clientRating', { days: t('overview.lastDays', { n: settings.recentDays }) })} />
      <RingCard index={1} value={onTime} total={100} color="#367b7f" big={`${onTime}%`} unit={t('overview.units.onTime')} label={t('overview.rings.readyOnTime')} />
      <RingCard index={2} value={capacity.used} total={capacity.places || 1} color="#e0892b" big={`${capacity.places ? Math.round((capacity.used / capacity.places) * 100) : 0}%`} unit={t('overview.units.capacity')} label={t('overview.rings.teamCapacity')} />
      <Card radius="rounded-tile" padding="none" className="col-span-2 flex min-w-0 animate-rise flex-col gap-3 px-6 py-5 [animation-delay:.55s]">
        <CardHead
          title={t('overview.rings.upNext')}
          sub={t('overview.rings.upNextSub', { sessions: t('overview.counts.session', { n: upNext.length }), days })}
          to={ROUTES.calendar}
          label={t('overview.links.calendar')}
        />
        <div className="scrollbar-slim flex h-55 flex-col gap-2 overflow-y-auto [mask-image:linear-gradient(180deg,#000_calc(100%-24px),transparent)]">
          {upNext.map((m, i) => (
            <Link
              key={m.id}
              to={memberPath(m.code)}
              style={{ animationDelay: `${0.4 + i * 0.05}s` }}
              className={cx('flex shrink-0 animate-rise items-center gap-3.5 rounded-[18px] p-2 text-ink transition-colors', i === 0 ? 'bg-brand-100 hover:bg-[#e1efef]' : 'bg-surface-2 hover:bg-surface')}
            >
              <span className={cx('flex size-13 shrink-0 flex-col items-center justify-center rounded-[14px]', i === 0 ? 'bg-brand-700 text-white' : 'bg-panel')}>
                <span className="text-[10px] tracking-[0.1em] uppercase opacity-75 rtl:tracking-normal">{weekdayShort(m.session.date)}</span>
                <span className="text-xl leading-none tabular-nums">{String(m.session.date.getDate()).padStart(2, '0')}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm">{m.name}</span>
                <span className="text-[13px] text-muted tabular-nums">{m.session.time}</span>
              </span>
              <StepBadge member={m} className="h-7 w-26 text-xs" />
            </Link>
          ))}
          {upNext.length === 0 && <p className="py-4 text-[13px] text-muted">{t('overview.rings.nothingNext', { days })}</p>}
        </div>
      </Card>
    </div>
  )
}
