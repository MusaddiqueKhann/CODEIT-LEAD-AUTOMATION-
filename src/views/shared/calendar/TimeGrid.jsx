import { Link } from 'react-router-dom'
import { StepBadge } from '../../../components/shared/index.js'
import { Button, cx } from '../../../components/ui/index.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { weekdayNames, riyadhNow } from '../../../models/rules/format.js'
import { memberPath } from '../../../routes/paths.js'
import { stepOfStage } from '../../../models/rules/stages.js'
import { HOUR, byStart, range, timeSpan } from './grid.js'
import { SessionAvatar } from './SessionAvatar.jsx'

const QUARTER = HOUR / 4
const CARD = 'absolute inset-x-1.5 z-1 flex flex-col justify-between gap-0.5 overflow-hidden rounded-[14px] px-2.5 py-2 text-start shadow-[0_8px_20px_-14px_rgb(30_50_80/0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-16px_rgb(30_50_80/0.35)]'

/** One column per day (a week, or a single day), a row per quarter hour, sessions placed by time. */
export function TimeGrid({ days, today, hours: [first, last], sessionsOn, onGroup }) {
  const { t } = useLang()
  const cols = { gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }
  const quarters = range(first * 4, last * 4)
  const now = riyadhNow()
  const nowAt = (now.getHours() + now.getMinutes() / 60 - first) * HOUR

  return (
    <div className={days.length > 1 ? 'min-w-225' : 'min-w-100'}>
      <div className="sticky top-0 z-3 grid border-b border-line bg-panel" style={cols}>
        <span />
        {days.map((d) => {
          const isToday = +d === +today
          return (
            <div key={+d} className="flex items-center gap-2.5 border-s border-line-soft px-3 py-2.5">
              <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl text-[15px]', isToday ? 'bg-brand-700 text-white' : 'bg-surface text-ink')}>
                {d.getDate()}
              </span>
              <span className="flex flex-col">
                <span className={cx('text-[11px] tracking-[0.12em] uppercase', isToday ? 'text-brand-700' : 'text-faint')}>{weekdayNames()[d.getDay()]}</span>
                <span className="text-xs text-muted">{t('calendar.sessions', { n: sessionsOn(d).length })}</span>
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid pt-3" style={cols}>
        <div className="flex flex-col">
          {quarters.map((q) => (
            <span
              key={q}
              style={{ height: QUARTER }}
              className={cx('-translate-y-1.75 px-2.5 text-end tabular-nums', q % 4 ? 'text-[10px] text-[#b5bac3]' : 'text-xs font-medium text-ink-2')}
            >
              {/* Left to right inside, or ":15" turns into "15:" in Arabic; the column itself mirrors. */}
              <span dir="ltr">{q % 4 ? `:${(q % 4) * 15}` : `${String(q / 4).padStart(2, '0')}:00`}</span>
            </span>
          ))}
        </div>
        {days.map((d) => {
          const isToday = +d === +today
          return (
            <div key={+d} className={cx('relative border-s border-line-soft', isToday && 'bg-[#fafcfc]')}>
              {quarters.map((q) => (
                <span
                  key={q}
                  style={{ height: QUARTER }}
                  className={cx('block border-t', q % 4 === 0 ? 'border-solid border-[#e9edf2]' : q % 2 === 0 ? 'border-dashed border-line' : 'border-dotted border-line-soft')}
                />
              ))}
              {byStart(sessionsOn(d)).map((group, i) => {
                const [one] = group
                const [h, m] = one.time.split(':').map(Number)
                const place = {
                  top: (h + m / 60 - first) * HOUR + 4,
                  height: (one.minutes / 60) * HOUR - 8,
                  animationDelay: `${0.2 + i * 0.05}s`,
                }
                return group.length === 1 ? (
                  <Link key={one.id} to={one.code ? memberPath(one.code) : '#'} style={place} className={cx(CARD, 'animate-rise bg-panel text-ink')}>
                    <span className="truncate text-[11px] text-soft tabular-nums">{timeSpan(one)}</span>
                    <span className="truncate text-[13px] font-medium">{one.title}</span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <SessionAvatar item={one} className="size-5.5 text-[9px]" />
                      <StepBadge step={stepOfStage(one.status)} className="block h-5.5 w-23 max-w-full text-center text-[11px] leading-5.5" />
                    </span>
                  </Link>
                ) : (
                  <Button key={one.id} variant="bare" style={place} onClick={() => onGroup(d, one.time)} className={cx(CARD, 'animate-rise bg-[#eef6f5] text-ink')}>
                    <span className="text-[11px] text-soft tabular-nums">{timeSpan(one)}</span>
                    <span className="text-[13px] font-medium">{t('calendar.sessions', { n: group.length })}</span>
                    <span className="flex items-center">
                      {group.slice(0, 4).map((x, j) => (
                        <SessionAvatar key={x.id} item={x} className={cx('size-6 text-[9px] ring-2 ring-[#f6faf9]', j > 0 && '-ms-1.5')} />
                      ))}
                      {group.length > 4 && (
                        <span className="-ms-1.5 grid size-6 place-items-center rounded-full bg-panel text-[10px] text-soft ring-2 ring-[#f6faf9]">+{group.length - 4}</span>
                      )}
                    </span>
                  </Button>
                )
              })}
              {isToday && nowAt > 0 && nowAt < (last - first) * HOUR && (
                <span className="absolute inset-x-0 z-2 h-0.5 bg-warn" style={{ top: nowAt }}>
                  <span className="absolute -top-1 -start-1.25 size-2.5 rounded-full bg-warn" />
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
