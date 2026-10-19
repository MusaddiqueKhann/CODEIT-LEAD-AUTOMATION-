import { Button, SectionHeader, TimelineRow, cx } from '../ui/index.js'
import { useBookings } from '../../context/BookingContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { SESSION_FORMAT, TODAY } from '../../data/mockData.js'
import { formatCountdown } from '../../lib/format.js'
import { sessionDateTime } from '../../lib/schedule.js'
import { TONE_DOT } from '../../lib/tones.js'
import { joinOpen, upcomingDay } from './dates.js'

/**
 * Everything on the books, the next session included — the hero headlines it,
 * this places it in sequence. The next one gets a washed card with its own
 * join/reschedule pair; the rest are one-line entries with a countdown.
 */
export function UpcomingTimeline() {
  const { upcomingBookings, startReschedule } = useBookings()
  const { toast } = useToast()

  if (!upcomingBookings.length) return null

  return (
    <section>
      <SectionHeader title="Upcoming" className="mb-4" />
      <ul className="flex flex-col gap-6">
        {upcomingBookings.map((booking, index) => {
          const featured = index === 0
          if (!featured) {
            return (
              <TimelineRow
                key={booking.id}
                time={booking.time}
                day={upcomingDay(booking.date)}
                bar="bg-brand-200"
              >
                <div className="pt-0.5">
                  <p className="text-[15px] leading-tight font-bold text-ink">
                    {SESSION_FORMAT.minutes} min · {SESSION_FORMAT.mode}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {booking.status} ·{' '}
                    {formatCountdown(sessionDateTime(booking.date, booking.time), TODAY)}
                  </p>
                </div>
              </TimelineRow>
            )
          }

          const canJoin = joinOpen(booking)
          return (
            <TimelineRow
              key={booking.id}
              time={booking.time}
              day={upcomingDay(booking.date)}
              bar="bg-brand-700"
            >
              <div className="rounded-2xl bg-brand-50 px-6 py-5">
                <p className="flex items-center gap-2.5 text-[15px] font-bold text-ink">
                  <span className={cx('size-2 shrink-0 rounded-full', TONE_DOT.brand)} />
                  {SESSION_FORMAT.minutes}-min {booking.status} session
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  Confirmed · {canJoin ? 'you can join now' : 'join opens 10 min before'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Button size="sm" disabled={!canJoin} onClick={() => toast('Opening your session…')}>
                    Join session
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startReschedule(booking.id)}>
                    Reschedule
                  </Button>
                </div>
              </div>
            </TimelineRow>
          )
        })}
      </ul>
    </section>
  )
}
