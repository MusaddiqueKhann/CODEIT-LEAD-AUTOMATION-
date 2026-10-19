import { useNavigate } from 'react-router-dom'
import { Ring, RingTile, cx } from '../ui/index.js'
import { useBookings } from '../../context/BookingContext.jsx'
import { user } from '../../data/mockData.js'
import { ROUTES } from '../../lib/nav.js'
import { CARD_TONE, TONES } from '../../lib/tones.js'
import { dayMonth } from './dates.js'

/**
 * The three ring tiles. The figures live inside their gauges rather than on a
 * 34px baseline, so this row deliberately skips StatCard — the shared frame
 * here is the Ring, not the stat layout.
 *
 * The ring fills are illustrative, not measures: attended is a closed loop (a
 * total has no axis to run along), and paid/upcoming fill against a nominal
 * handful so one or two sessions read as an arc instead of a sliver or a
 * full circle.
 */
export function StatTiles() {
  const { allowance, upcomingBookings } = useBookings()
  const navigate = useNavigate()
  const { paidBalance, attended } = allowance
  const next = upcomingBookings[0]

  return (
    <div className="grid gap-5 sm:grid-cols-3">
      <RingTile
        eyebrow="Attended"
        ring={
          <Ring value={1} max={1} size={56} thickness={5} tone="brand">
            <span className="text-lg font-bold text-ink">{attended}</span>
          </Ring>
        }
      >
        <p className="mt-1 truncate text-sm text-muted">since {user.memberSince}</p>
      </RingTile>

      <RingTile
        surface={CARD_TONE.warn}
        eyebrow="Paid"
        eyebrowClass={TONES.warn.text}
        link={{ label: 'Add sessions', onClick: () => navigate(ROUTES.payments) }}
        ring={
          <Ring value={paidBalance} max={4} size={56} thickness={5} tone="warn">
            <span className={cx('text-lg font-bold', TONES.warn.text)}>{paidBalance}</span>
          </Ring>
        }
      />

      <RingTile
        eyebrow="Upcoming"
        ring={
          <Ring value={upcomingBookings.length} max={4} size={56} thickness={5} tone="brand">
            <span className="text-lg font-bold text-ink">{upcomingBookings.length}</span>
          </Ring>
        }
      >
        <p className="mt-1 truncate text-sm text-muted">
          {next ? `next ${dayMonth(next.date)}` : 'nothing booked'}
        </p>
      </RingTile>
    </div>
  )
}
