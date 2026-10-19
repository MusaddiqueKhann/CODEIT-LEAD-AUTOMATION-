import { Badge, IconTile, Rating } from '../ui/index.js'
import { SESSION_FORMAT } from '../../data/mockData.js'
import { formatMedium } from '../../lib/format.js'
import { STATUS_TONE } from '../../lib/tones.js'
import { SessionRow } from './SessionRow.jsx'

/**
 * One past session. Rating happens right in the row — tap a star and it's
 * done — instead of routing through the Feedback page; that page remains the
 * place for ratings with comments.
 */
export function PastRow({ booking, onRate }) {
  return (
    <SessionRow
      tile={<IconTile name="calendar" tone="neutral" size="lg" />}
      title={formatMedium(booking.date)}
      subtitle={
        <>
          {SESSION_FORMAT.minutes} min · {SESSION_FORMAT.mode} · {booking.time}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge dot tone={STATUS_TONE[booking.status] ?? 'neutral'}>
          {booking.status}
        </Badge>

        {booking.rated ? (
          <Badge tone="warn">★ {booking.rating}.0 · Rated</Badge>
        ) : booking.status === 'Completed' ? (
          <Rating size="sm" value={0} onChange={(stars) => onRate(booking.id, stars)} />
        ) : null}
      </div>
    </SessionRow>
  )
}
