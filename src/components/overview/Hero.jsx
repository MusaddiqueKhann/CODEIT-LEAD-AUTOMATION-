import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/index.js'
import { useBookings } from '../../context/BookingContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { SESSION_FORMAT, TODAY } from '../../data/mockData.js'
import { formatCountdown, formatRelativeDay } from '../../lib/format.js'
import { sessionDateTime } from '../../lib/schedule.js'
import { ROUTES } from '../../lib/nav.js'
import { joinOpen } from './dates.js'

/**
 * The dark hero — the next session as a headline, not a list row.
 *
 * A gradient across the deep end of the ramp (950 → 900) rather than one flat
 * fill; both steps carry soft white at AAA, so nothing on it needs re-tuning.
 * The join button takes the accent seed — the one brand value bright enough to
 * read as *the* action on a dark ground.
 */
export function Hero() {
  const { nextSession, startReschedule } = useBookings()
  const { toast } = useToast()
  const navigate = useNavigate()

  if (!nextSession) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-deep to-brand-900 px-7 py-7 sm:px-9 sm:py-8">
        <div>
          <p className="eyebrow text-deep-muted">Next session</p>
          <p className="mt-2 text-2xl font-bold text-on-brand-light">Nothing booked yet</p>
          <p className="mt-1.5 text-sm text-deep-muted">
            Pick a slot and it will show up here with a join link.
          </p>
        </div>
        <Button variant="accent" icon="plus" onClick={() => navigate(ROUTES.book)}>
          Book a session
        </Button>
      </section>
    )
  }

  const start = sessionDateTime(nextSession.date, nextSession.time)
  const canJoin = joinOpen(nextSession)

  return (
    <section className="rounded-3xl bg-gradient-to-br from-deep to-brand-900 px-7 py-7 sm:px-9 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-6">
        <div>
          <p className="eyebrow text-deep-muted">Next session</p>
          {/* Soft white at display size — large text, where 3:1 applies and the
              anti-glare cut is the point. "AST" drops to deep-muted: at 14px it
              is small text, and deep-muted holds 7.48:1 on the 950 end. */}
          <h2 className="mt-2.5 text-[32px] leading-tight font-bold tracking-tight text-on-brand-light sm:text-[38px]">
            {formatRelativeDay(nextSession.date, TODAY)} · {nextSession.time}
            <span className="ml-2.5 align-middle text-sm font-semibold text-deep-muted">AST</span>
          </h2>
          <p className="mt-2 text-[13px] text-deep-muted">
            {SESSION_FORMAT.minutes}-min {nextSession.status} · confirmed ·{' '}
            {canJoin ? formatCountdown(start, TODAY) : 'join opens 10 min before'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="accent"
            disabled={!canJoin}
            onClick={() => toast('Opening your session…')}
          >
            Join session
          </Button>
          <Button variant="onDarkGhost" onClick={() => startReschedule(nextSession.id)}>
            Reschedule
          </Button>
        </div>
      </div>
    </section>
  )
}
