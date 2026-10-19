import { Rating } from '../ui/index.js'
import { RATING_ACCENT } from './ratingAccent.js'
import { SESSION_FORMAT } from '../../data/mockData.js'
import { monthShort } from '../../lib/format.js'

/**
 * One rated session, as a ruled row.
 *
 * A time/date column, a hairline rule, the session line with the rating that
 * was given, then the comment underneath when there is one — a table read
 * rather than a card. items-stretch lets the rule span the full height of the
 * time column instead of just the single content line.
 */
export function CompletedFeedbackRow({ booking }) {
  return (
    <li className="flex items-stretch gap-6 py-6 sm:gap-8">
      <div className="flex w-20 shrink-0 flex-col justify-center">
        <p className="text-[15px] font-bold text-ink">{booking.time}</p>
        <p className="mt-1 text-[13px] text-muted">
          {booking.date.getDate()} {monthShort(booking.date)}
        </p>
      </div>

      {/* The same soft brand tick the Overview timeline uses for its past
          sessions, rather than a hairline border. */}
      <span className="w-[3px] shrink-0 self-stretch rounded-full bg-brand-100" />

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="flex flex-wrap items-baseline gap-x-3 text-[15px]">
            <span className="font-bold text-ink">
              {booking.minutes ?? SESSION_FORMAT.minutes} min · {SESSION_FORMAT.mode}
            </span>
            <span className="text-muted">{booking.title}</span>
          </p>
          {/* The rating is data now, not a control, so it reads as a static row
              and stays out of the tab order. */}
          <Rating
            value={booking.rating}
            readOnly
            size="sm"
            fill={RATING_ACCENT[booking.rating]?.text ?? 'text-warn'}
          />
        </div>

        {booking.comment && (
          <p className="mt-2 text-[14px] italic text-muted">“{booking.comment}”</p>
        )}
      </div>
    </li>
  )
}
