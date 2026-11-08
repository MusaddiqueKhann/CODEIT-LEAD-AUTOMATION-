import { useState } from 'react'
import { Switch, TimeSelect } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { updateSettings } from '../../../controllers/admin/settings.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { weekdayNames } from '../../../models/rules/format.js'
import { toMinutes } from '../../../models/rules/time.js'
import { Section } from './Section.jsx'
import { useUnsaved } from '../../../controllers/shared/unsaved.js'

/* The week grid runs 07:00 to 20:00, with a label every two hours and a faint line at each. */
const FIRST = 7 * 60
const SPAN = 13 * 60
const MARKS = [7, 9, 11, 13, 15, 17, 19]
const pct = (minutes) => `${Math.min(100, Math.max(0, ((minutes - FIRST) / SPAN) * 100))}%`
const hoursOf = (d) => Math.max(0, toMinutes(d.to) - toMinutes(d.from)) / 60
/* A bar's start or end time: picked like any time, but it reads as the bar's plain white text. */
const BAR_TIME = 'cursor-pointer appearance-none rounded-md bg-transparent px-1 text-center text-xs text-white tabular-nums outline-none hover:bg-white/15 focus-visible:ring-1 focus-visible:ring-white [&>option]:text-ink'

/**
 * Admin: the office's working days and hours as a week of bars (saved from the bar at the bottom;
 * a bar's start and end times are picked in place). Public holidays are HolidaysSection.
 */
export function WorkingWeekTab({ after }) {
  const { settings } = useConfig()
  const { t } = useLang()
  const { run } = useAction(after)
  const [hours, setHours] = useState(settings.officeHours)
  const names = weekdayNames()
  const set = (i, patch) => setHours((h) => h.map((d, n) => (n === i ? { ...d, ...patch } : d)))
  const total = hours.filter((d) => d.on).reduce((sum, d) => sum + hoursOf(d), 0)

  useUnsaved('week', JSON.stringify(hours) !== JSON.stringify(settings.officeHours), () => run(() => updateSettings({ office_hours: hours })))

  return (
    <Section id="week" icon="calendar">
      <div className="scrollbar-slim overflow-x-auto">
        <div className="grid min-w-160 grid-cols-[52px_repeat(7,minmax(0,1fr))] gap-2.5">
          <span />
          {hours.map((d, i) => (
            <span key={names[i]} className="flex flex-col items-center gap-2 text-sm">
              <span className={d.on ? 'text-ink' : 'text-muted'}>{names[i]}</span>
              <Switch id={`working-week-tab-${i}-on`} on={d.on} label={names[i]} onChange={(on) => set(i, { on })} />
            </span>
          ))}

          <div className="relative h-82.5 text-[11px] text-muted tabular-nums">
            {MARKS.map((h) => (
              <span key={h} style={{ top: pct(h * 60) }} className="absolute end-1 -translate-y-1/2">
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>
          {hours.map((d, i) => (
            <div key={names[i]} className="relative h-82.5 rounded-2xl bg-surface">
              {MARKS.slice(1).map((h) => (
                <span key={h} style={{ top: pct(h * 60) }} className="absolute inset-x-2.5 h-px bg-surface-hover" />
              ))}
              {d.on ? (
                <span
                  style={{ top: pct(toMinutes(d.from)), height: `calc(${pct(toMinutes(d.to))} - ${pct(toMinutes(d.from))})` }}
                  className="absolute inset-x-1.25 flex animate-rise flex-col items-center justify-between rounded-xl bg-brand-700 py-1.5 text-xs text-white"
                >
                  <TimeSelect id={`working-week-tab-${i}-from`} aria-label={t('shared.components.hours.dayFrom', { day: names[i] })} value={d.from} onChange={(e) => set(i, { from: e.target.value })} className={BAR_TIME} />
                  <span className="text-base">{t('admin.settings.week.hours', { n: +hoursOf(d).toFixed(2) })}</span>
                  <TimeSelect id={`working-week-tab-${i}-to`} aria-label={t('shared.components.hours.dayTo', { day: names[i] })} value={d.to} onChange={(e) => set(i, { to: e.target.value })} className={BAR_TIME} />
                </span>
              ) : (
                <span className="absolute inset-0 grid place-items-center text-xs text-ghost [writing-mode:vertical-rl]">{t('shared.components.hours.dayOff')}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="text-end text-[13px] text-soft">{t('admin.person.hours.perWeek', { hours: +total.toFixed(2) })}</p>
    </Section>
  )
}
