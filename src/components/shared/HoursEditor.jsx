import { useLang } from '../../controllers/shared/LangContext.jsx'
import { weekdayNames } from '../../models/rules/format.js'
import { Button, Switch, cx } from '../ui/index.js'

const TIME = 'h-10 cursor-pointer rounded-xl bg-panel px-3 text-[13px] text-ink tabular-nums outline-none disabled:cursor-default disabled:bg-surface-2 disabled:text-ghost'
/* Every quarter hour of the day, 24-hour: the same in English and Arabic (a browser's own time box follows its own language). */
const QUARTERS = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`)

/** A time of day to pick; a saved time off the quarter hours stays in the list. A `className` replaces the box look. */
export function TimeSelect({ value, ...rest }) {
  const times = QUARTERS.includes(value) ? QUARTERS : [...QUARTERS, value].sort()
  return (
    <select value={value} className={TIME} {...rest}>
      {times.map((x) => (
        <option key={x} value={x}>
          {x}
        </option>
      ))}
    </select>
  )
}

/**
 * Weekly hours: "Office hours" (null), or the person's own seven days of { on, from, to },
 * Sunday first, a switch and two times a day. Starting own hours copies the office hours to edit
 * from. `fixed` always shows the seven days (the office hours themselves).
 */
export function HoursEditor({ value, office, onChange, fixed = false }) {
  const { t } = useLang()
  const days = weekdayNames()
  const own = Array.isArray(value)
  const set = (i, patch) => onChange(value.map((d, n) => (n === i ? { ...d, ...patch } : d)))
  const pill = (on) => cx('h-9.5 rounded-full px-4.5 text-[13px] transition-colors', on ? 'bg-brand-700 text-white' : 'text-soft hover:text-ink')

  return (
    <div className="flex flex-col gap-3">
      {!fixed && (
        <div className="inline-flex gap-1 self-start rounded-full bg-track p-1">
          <Button variant="bare" aria-pressed={!own} onClick={() => onChange(null)} className={pill(!own)}>
            {t('team.hours.office')}
          </Button>
          <Button variant="bare" aria-pressed={own} onClick={() => !own && onChange(office.map((d) => ({ ...d })))} className={pill(own)}>
            {t('team.hours.own')}
          </Button>
        </div>
      )}
      {own && (
        <div className="flex flex-col gap-0.5 rounded-[20px] bg-field p-2">
          {value.map((d, i) => (
            <div key={days[i]} className="flex flex-wrap items-center gap-3.5 px-2.5 py-1.5">
              <span className="flex items-center gap-2.5">
                <Switch on={d.on} label={days[i]} onChange={(on) => set(i, { on })} />
                <span className={cx('w-10 text-sm rtl:w-16', d.on ? 'text-ink' : 'text-ghost')}>{days[i]}</span>
              </span>
              <TimeSelect aria-label={t('team.hours.dayFrom', { day: days[i] })} value={d.from} disabled={!d.on} onChange={(e) => set(i, { from: e.target.value })} />
              <span className="text-[13px] text-muted">{t('team.hours.to')}</span>
              <TimeSelect aria-label={t('team.hours.dayTo', { day: days[i] })} value={d.to} disabled={!d.on} onChange={(e) => set(i, { to: e.target.value })} />
              {!d.on && <span className="text-[13px] text-ghost">{t('team.hours.dayOff')}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
