import { Card, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { dayKey, formatShort, monthShort, riyadhNow, weekdayShort } from '../../../models/rules/format.js'
import { hourOf, leaveOn, sessionsOn } from '../../../models/rules/week.js'

const START = 6
const SPAN = 16
const at = (h) => `${((h - START) / SPAN) * 100}%`
const width = (h) => `${(h / SPAN) * 100}%`
const TICKS = ['06', '08', '10', '12', '14', '16', '18', '20', '22']
const OFF = 'bg-[repeating-linear-gradient(135deg,#eef1f5_0_6px,#e3e7ec_6px_12px)]'

/** This week, day by day: the working hours as a free band, sessions on top, and the free time left. */
export function BusyFree({ person, hours, week, leave, members }) {
  const { holidays } = useConfig()
  const { t } = useLang()
  const first = person.name.split(' ')[0]
  const now = riyadhNow()
  const today = dayKey(now)
  const nowH = now.getHours() + now.getMinutes() / 60

  return (
    <Card as="section" padding="none" className="flex animate-rise flex-col gap-5 px-6 py-6 [animation-delay:.42s]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-h2 text-ink">{t('person.busy.title')}</h2>
          <p className="text-[13px] text-muted">{t('person.busy.sub', { from: formatShort(week[0]), to: formatShort(week[6]), name: first })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-soft">
          <span className="flex items-center gap-2">
            <span className="size-3.5 rounded-[5px] bg-brand-700" />
            {t('person.busy.session')}
          </span>
          <span className="flex items-center gap-2">
            <span className="size-3.5 rounded-[5px] bg-[#e6f2f1] ring-1 ring-[#c6dfdd] ring-inset" />
            {t('person.busy.free')}
          </span>
          <span className="flex items-center gap-2">
            <span className={cx('size-3.5 rounded-[5px]', OFF)} />
            {t('person.busy.off')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[80px_minmax(0,1fr)_130px] gap-4 px-1 text-[11px] text-faint">
        <span />
        <div className="flex justify-between">
          {TICKS.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <span className="text-end">{t('person.busy.freeTime')}</span>
      </div>

      <div className="flex flex-col gap-2">
        {week.map((date, i) => {
          const day = dayKey(date)
          const h = hours[i]
          const holiday = holidays.find((x) => x.day === day)
          const away = leaveOn(leave, day)
          const on = h.on && !holiday
          const from = hourOf(h.from)
          const to = hourOf(h.to)
          const sessions = on ? sessionsOn(members, person.id, day).filter(([a, b]) => a >= from && b <= to) : []
          const free = on ? to - from - sessions.reduce((s, [a, b]) => s + b - a, 0) : 0
          const isToday = day === today
          const freeHours = Number.isInteger(free) ? free : free.toFixed(1)
          const text = !on
            ? (holiday ? holiday.name : t('person.busy.off'))
            : away
              ? t('person.busy.onLeave')
              : sessions.length
                ? t('person.busy.withSessions', { h: freeHours, n: sessions.length })
                : t('person.busy.hoursFree', { h: freeHours })

          return (
            <div
              key={day}
              style={{ animationDelay: `${0.5 + i * 0.04}s` }}
              className={cx('grid animate-rise grid-cols-[80px_minmax(0,1fr)_130px] items-center gap-4 rounded-xl px-1 py-1', isToday && 'bg-[#f6faf9]')}
            >
              <span className="flex flex-col">
                <span className={cx('text-[13px]', on ? 'text-ink' : 'text-ghost', isToday && 'font-medium')}>{weekdayShort(date)}</span>
                <span className="text-[11px] text-faint">
                  {String(date.getDate()).padStart(2, '0')} {monthShort(date)}
                </span>
              </span>
              <div className={cx('relative h-8 overflow-hidden rounded-[10px]', on ? 'bg-surface' : OFF)}>
                {on && (
                  <span
                    className={cx(
                      'absolute inset-y-1 rounded-[7px] ring-1 ring-[#c6dfdd] ring-inset',
                      away ? 'bg-[repeating-linear-gradient(135deg,#fff3e6_0_6px,#fde3c4_6px_12px)]' : 'bg-[#e6f2f1]',
                    )}
                    style={{ insetInlineStart: at(from), width: width(to - from) }}
                  />
                )}
                {sessions.map(([a, b, m]) => (
                  <span
                    key={m.id}
                    title={`${m.session.time} · ${m.name}`}
                    className="absolute inset-y-1 z-1 flex items-center justify-center overflow-hidden rounded-[7px] bg-brand-700 px-2 text-[11px] whitespace-nowrap text-white"
                    style={{ insetInlineStart: at(a), width: `max(${width(b - a)}, 56px)` }}
                  >
                    {m.firstName}
                  </span>
                ))}
                {isToday && nowH > START && nowH < START + SPAN && <span className="absolute inset-y-0 z-2 w-0.5 bg-warn" style={{ insetInlineStart: at(nowH) }} />}
              </div>
              <span className={cx('text-end text-xs whitespace-nowrap', !on ? 'text-ghost' : away ? 'text-warn-ink' : 'text-success-ink')}>{text}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
