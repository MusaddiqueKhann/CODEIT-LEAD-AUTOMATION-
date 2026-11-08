import { useState } from 'react'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { monthShort, weekdayShort } from '../../models/rules/format.js'
import { byPartOfDay, initials, toMinutes, toTime } from '../../models/rules/time.js'
import { Button } from '../ui/Button.jsx'
import { cx } from '../cx.js'

const TAGS = ['earliest', 'next', 'later']
/* byPartOfDay names the halves 'Morning' and 'Afternoon'; their words are shared.components.slots.morning / afternoon. */
const part = (name) => name.toLowerCase()

/**
 * Pick one of the first three open days, then morning or afternoon, then a time. The caller loads
 * the times: `days` are the bookable days, `day` the index shown, `slots` that day's
 * [{ time, free, people }] (null while loading). `flow` ([{ k, v }]) is the lead-in drawn before
 * the days, e.g. Files in → Buffer. `value` is { date, time } or null. Add a member and the Sales tab.
 */
export function SlotPicker({ days, day, onDay, slots, length, value, onChange, flow }) {
  const { person } = useConfig()
  const { t } = useLang()
  const [chosen, setChosen] = useState(null)
  const date = days[day]
  const halves = byPartOfDay(slots ?? [])
  const half = halves.find(([name]) => name === chosen) ?? halves.find(([, list]) => list.some((s) => s.free)) ?? halves[0]
  const open = half?.[1].filter((s) => s.free) ?? []
  const time = value && date && +value.date === +date ? value.time : null
  const other = halves.find(([name]) => name !== half?.[0])?.[0]

  if (days.length === 0) return <p className="py-6 text-sm text-muted">{t('shared.components.slots.noDays')}</p>

  return (
    <>
      <div className="flex flex-col gap-2.5 py-5">
        <span className="text-[15px] font-medium text-ink">{t('shared.components.slots.date')}</span>
        <div className={cx('relative grid grid-cols-3 items-center gap-2.5', flow && 'sm:grid-cols-[minmax(0,.7fr)_minmax(0,.7fr)_repeat(3,minmax(0,1fr))]')}>
          {flow && <span aria-hidden="true" className="absolute start-2 end-6 top-1/2 hidden h-0.5 bg-line sm:block" />}
          {flow?.map((f, i) => (
            <div key={f.k} className="relative hidden flex-col gap-2 sm:flex">
              <span className="text-xs text-muted">{f.k}</span>
              <span className={cx('size-4 rounded-full bg-panel', i === 0 ? 'shadow-[inset_0_0_0_4px_var(--color-brand-700)]' : 'shadow-[inset_0_0_0_4px_var(--color-brand-ring-2)]')} />
              <span className="text-sm whitespace-nowrap text-ink">{f.v}</span>
            </div>
          ))}
          {days.slice(0, 3).map((d, i) => {
            const on = day === i
            return (
              <Button id={`slot-picker-slots-${+d}`}
                key={+d}
                variant="bare"
                aria-pressed={on}
                onClick={() => {
                  onDay(i)
                  onChange(null)
                }}
                className={cx(
                  'relative flex h-28 min-w-0 flex-col items-center justify-center gap-1 rounded-[22px] transition duration-300',
                  on ? '-translate-y-0.5 bg-brand-700 text-white shadow-[0_16px_28px_-18px_rgba(54,123,127,0.9)]' : 'bg-surface-2 text-ink ring-1 ring-line ring-inset hover:bg-surface',
                )}
              >
                <span className="text-[11px] opacity-80">{t(`shared.components.slots.${TAGS[i]}`)}</span>
                <span className="text-xs tracking-[0.12em] uppercase opacity-75">{weekdayShort(d)}</span>
                <span className="text-stat leading-none tabular-nums">{d.getDate()}</span>
                <span className="text-xs opacity-70">{monthShort(d)}</span>
              </Button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-line pt-5.5 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[15px] font-medium text-ink">{t('shared.components.slots.time')}</span>
          {halves.length > 0 && (
            <div className="inline-flex rounded-full bg-field p-1">
              {halves.map(([name, list]) => {
                const on = name === half?.[0]
                return (
                  <Button id={`slot-picker-part-${name}`}
                    key={name}
                    variant="bare"
                    aria-pressed={on}
                    onClick={() => setChosen(name)}
                    className={cx('h-9.5 rounded-full px-3.5 text-sm whitespace-nowrap transition', on ? 'bg-panel text-brand-700 shadow-[0_2px_6px_-2px_rgba(30,50,80,0.18)]' : 'text-soft')}
                  >
                    {t(`shared.components.slots.${part(name)}`)}
                    <span className="ms-1.5 opacity-60">
                      {list[0].time} – {toTime(toMinutes(list.at(-1).time) + length)}
                    </span>
                  </Button>
                )
              })}
            </div>
          )}
        </div>
        {!slots ? (
          <p className="py-4 text-sm text-muted">{t('shared.components.slots.loadingTimes')}</p>
        ) : open.length === 0 ? (
          <p className="py-4 text-sm text-muted">
            {t(`shared.components.slots.nobody.${half ? part(half[0]) : 'day'}`)}
            {other && ` ${t(`shared.components.slots.tryOther.${part(other)}`)}`}
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
            {open.map((s) => {
              const on = time === s.time
              const names = s.people.map((id) => person(id)?.name).filter(Boolean)
              return (
                <Button id={`slot-picker-on-change-${s.time}`}
                  key={s.time}
                  variant="bare"
                  aria-pressed={on}
                  onClick={() => onChange({ date, time: s.time })}
                  className={cx(
                    'flex min-h-19 min-w-0 items-center gap-3.5 overflow-hidden rounded-[20px] px-4 py-3.5 transition duration-300',
                    on ? 'bg-brand-700 text-white shadow-[0_16px_28px_-18px_rgba(54,123,127,0.9)]' : 'bg-surface-2 text-ink ring-1 ring-line ring-inset hover:bg-surface',
                  )}
                >
                  <span className="flex shrink-0 -space-x-3">
                    {names.slice(0, 2).map((n) => (
                      <span
                        key={n}
                        className={cx('grid size-9.5 place-items-center rounded-full text-xs ring-2', on ? 'bg-panel text-brand-700 ring-brand-700' : 'bg-brand-900 text-white ring-surface-2')}
                      >
                        {initials(n)}
                      </span>
                    ))}
                  </span>
                  <span className="flex min-w-0 flex-col gap-px text-start">
                    <span className="text-lg tracking-[-0.02em] tabular-nums">{s.time}</span>
                    <span className="truncate text-xs opacity-75">
                      {names.length === 1 ? names[0].split(' ')[0] : t('shared.components.slots.free', { n: names.length })} · {t('shared.components.slots.minutes', { n: length })}
                    </span>
                  </span>
                </Button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
