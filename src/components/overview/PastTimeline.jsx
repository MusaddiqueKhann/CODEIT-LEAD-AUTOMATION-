import { useNavigate } from 'react-router-dom'
import { Button, EmptyState, SectionHeader, TimelineRow, cx } from '../ui/index.js'
import { useBookings } from '../../context/BookingContext.jsx'
import { SESSION_FORMAT } from '../../data/mockData.js'
import { ROUTES } from '../../lib/nav.js'
import { STATUS_TONE, TONES } from '../../lib/tones.js'
import { dayMonth } from './dates.js'

/**
 * The three most recent past sessions, each a row that opens the Feedback
 * page — the status word carries its tone, the title turns brand on hover.
 */
export function PastTimeline() {
  const { pastBookings } = useBookings()
  const navigate = useNavigate()
  const recent = pastBookings.slice(0, 3)

  return (
    <section>
      <SectionHeader title="Past sessions" className="mb-4" />

      {recent.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No sessions yet"
          description="Your history starts after the first one."
        />
      ) : (
        <ul className="flex flex-col gap-6">
          {recent.map((booking) => {
            const tone = STATUS_TONE[booking.status] ?? 'neutral'
            return (
              <TimelineRow
                key={booking.id}
                time={booking.time}
                day={dayMonth(booking.date)}
                bar="bg-brand-100"
              >
                <Button
                  variant="bare"
                  onClick={() => navigate(ROUTES.feedback)}
                  className="group flex w-full items-center justify-between gap-4 pt-0.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-[15px] leading-tight font-bold text-ink transition-colors group-hover:text-brand-700">
                      {SESSION_FORMAT.minutes} min · {SESSION_FORMAT.mode}
                      <span className="ml-2.5 text-[13px] font-normal text-muted">
                        {booking.title}
                      </span>
                    </span>
                  </span>
                  <span
                    className={cx(
                      'shrink-0 text-[13px] font-semibold',
                      TONES[tone]?.text ?? TONES.brand.text,
                    )}
                  >
                    {booking.status}
                  </span>
                </Button>
              </TimelineRow>
            )
          })}
        </ul>
      )}
    </section>
  )
}
