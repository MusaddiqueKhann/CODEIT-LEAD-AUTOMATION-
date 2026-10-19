import Icon from '../Icon.jsx'
import { Button } from '../ui/index.js'
import { cx } from '../../lib/cx.js'
import { partOfDay, slotEnd } from '../../lib/schedule.js'

/** "10:00 AM" → "10:00" — the tag carries the meridiem, so the range doesn't repeat it. */
const clock = (time) => time.replace(/ [AP]M$/, '')

/**
 * The time-slot chooser for one day: one row per slot, with an AM/PM chip,
 * the range, the format, and the slot's status.
 *
 * A taken slot renders disabled with its reason in the accessible name rather
 * than being hidden — a user who booked 6:00 PM should see that 6:00 PM exists
 * and is theirs, not find the list mysteriously one row shorter.
 */
export function SlotList({ times, value, onChange, isTaken, minutes, mode, className }) {
  return (
    <div role="radiogroup" aria-label="Session time" className={cx('grid gap-2', className)}>
      {times.map((time) => {
        const taken = isTaken(time)
        const selected = time === value
        const end = slotEnd(time, minutes)
        const part = partOfDay(time)
        const meridiem = time.endsWith('PM') ? 'PM' : 'AM'

        return (
          <Button
            key={time}
            variant="bare"
            role="radio"
            aria-checked={selected}
            disabled={taken}
            aria-label={`${time} – ${end}, ${part}${taken ? ' — already booked' : ''}`}
            onClick={() => onChange(time)}
            className={cx(
              'grid grid-cols-[3.25rem_1fr_auto_5.5rem] items-center gap-4 rounded-xl border px-5 py-3.5 text-left transition duration-200 ease-out active:scale-[0.99] short:py-2 [&>*]:transition-colors [&>*]:duration-200',
              taken
                ? 'cursor-not-allowed border-line-soft bg-surface'
                : selected
                  ? 'border-brand-800 bg-brand-800'
                  : 'border-line bg-panel hover:border-brand-300 hover:bg-surface',
            )}
          >
            <span
              className={cx(
                'inline-flex h-7 items-center justify-center rounded-lg text-[11px] font-bold tracking-[0.08em]',
                taken
                  ? 'bg-surface-2 text-faint'
                  : selected
                    ? 'bg-white/15 text-white'
                    : 'bg-surface-2 text-brand-900',
              )}
            >
              {meridiem}
            </span>
            <span
              className={cx(
                'text-lg font-medium',
                taken ? 'text-faint' : selected ? 'text-white' : 'text-ink',
              )}
            >
              {clock(time)} – {clock(end)}
            </span>
            <span
              className={cx(
                'text-[13px]',
                taken ? 'text-faint' : selected ? 'text-brand-200' : 'text-muted',
              )}
            >
              {minutes} min {mode}
            </span>
            {selected ? (
              <span className="flex items-center justify-end gap-1.5 text-[13px] font-semibold text-white">
                <Icon name="checkCircle" className="size-4" strokeWidth={2.2} />
                Selected
              </span>
            ) : (
              <span
                className={cx(
                  'text-right text-[13px] font-semibold',
                  taken ? 'text-faint' : 'text-brand-800',
                )}
              >
                {taken ? 'Booked' : 'Open'}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
