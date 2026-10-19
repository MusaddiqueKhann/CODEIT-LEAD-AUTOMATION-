import { useMemo, useState } from 'react'
import Icon from '../Icon.jsx'
import { Button } from '../ui/index.js'
import { cx } from '../../lib/cx.js'
import { formatShort, isSameDay, monthYear, WEEKDAY_LABELS } from '../../lib/format.js'
import { isWeekend } from '../../lib/schedule.js'

function monthGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array(new Date(year, month, 1).getDay()).fill(null)

  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * `openSlots` maps a bookable day (as getTime()) to how many slots are still
 * free on it; the count renders under the date so a reader can pick a quiet
 * day without clicking through. Days missing from the map are not bookable.
 */
export function MonthCalendar({
  days,
  value,
  onChange,
  openSlots = new Map(),
  today,
  className = 'rounded-2xl border border-line bg-panel px-5 py-6',
  ref,
}) {
  const bookable = useMemo(() => new Set(days.map((day) => day.getTime())), [days])

  const firstMonth = startOfMonth(days[0])
  const lastMonth = startOfMonth(days[days.length - 1])

  /* Opens on the selected date's month, not on today's — when a booking is
     being moved, its own month is the context the user is reasoning from. */
  const [view, setView] = useState(() => startOfMonth(value))

  const shiftMonth = (by) => setView((v) => new Date(v.getFullYear(), v.getMonth() + by, 1))

  const canGoBack = view > firstMonth
  const canGoForward = view < lastMonth

  const cells = monthGrid(view.getFullYear(), view.getMonth())

  return (
    <div ref={ref} className={className}>
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <p className="font-display text-2xl leading-none font-extrabold tracking-tight text-ink">
          {monthYear(view)}
        </p>

        <div className="flex items-center gap-1">
          <MonthArrow direction="prev" disabled={!canGoBack} onClick={() => shiftMonth(-1)} />
          <MonthArrow direction="next" disabled={!canGoForward} onClick={() => shiftMonth(1)} />
        </div>
      </div>

      <div className="mb-2 grid shrink-0 grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] font-semibold tracking-[0.08em] text-muted uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div
        role="radiogroup"
        aria-label="Session date"
        className="grid max-h-[450px] min-h-0 flex-1 auto-rows-fr grid-cols-7 gap-1.5 sm:gap-2"
      >
        {cells.map((day, index) => {
          if (!day) return <div key={`pad-${index}`} aria-hidden="true" />

          const open = bookable.has(day.getTime())
          const selected = open && isSameDay(day, value)
          const count = openSlots.get(day.getTime())
          const isToday = today && isSameDay(day, today)

          /* One line under the number, never two — a fixed-height slot keeps
             every cell the same size whether or not it has something to say. */
          const note = !open
            ? isWeekend(day)
              ? 'Closed'
              : '—'
            : count === 0
              ? 'Full'
              : count > 0
                ? `${count} slot${count === 1 ? '' : 's'}`
                : ''

          return (
            <Button
              key={day.getTime()}
              variant="bare"
              role="radio"
              aria-checked={selected}
              disabled={!open}
              aria-label={
                open
                  ? `${isToday ? 'Today, ' : ''}${formatShort(day)} — ${note}`
                  : `${formatShort(day)} — not available`
              }
              onClick={() => onChange(day)}
              className={cx(
                /* Fills its row on desktop, where the grid is sized to the
                   screen; keeps a floor on phones, where rows follow content. */
                'flex min-h-14 w-full flex-col items-center justify-center rounded-xl border transition duration-200 ease-out active:scale-[0.98] lg:min-h-0 [&>*]:transition-colors [&>*]:duration-200',
                !open
                  ? // A filled grey tile, not an outline, and a touch smaller than
                    // the live days: past and closed days read as background, not
                    // as controls that happen to be off.
                    'scale-95 cursor-not-allowed border-transparent bg-surface-2 text-faint'
                  : selected
                    ? 'border-brand-800 bg-brand-800 text-white'
                    : 'border-line bg-panel text-ink hover:border-brand-300 hover:bg-surface',
              )}
            >
              <span className="text-[15px] leading-none font-semibold sm:text-lg sm:font-bold">
                {day.getDate()}
              </span>
              <span
                className={cx(
                  'mt-1 h-3 text-[10px] leading-3 font-medium',
                  selected ? 'text-white/85' : open ? 'text-muted' : 'text-faint',
                )}
              >
                {note}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function MonthArrow({ direction, disabled, onClick }) {
  const isPrev = direction === 'prev'

  return (
    <Button
      variant="bare"
      disabled={disabled}
      onClick={onClick}
      aria-label={isPrev ? 'Previous month' : 'Next month'}
      className={cx(
        'flex size-8 items-center justify-center rounded-lg transition',
        disabled ? 'cursor-not-allowed text-faint' : 'text-ink hover:bg-surface',
      )}
    >
      <Icon name={isPrev ? 'chevronLeft' : 'chevronRight'} className="size-4" strokeWidth={2.4} />
    </Button>
  )
}
