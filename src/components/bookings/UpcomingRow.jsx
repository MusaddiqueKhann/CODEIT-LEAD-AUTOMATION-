import Icon from '../Icon.jsx'
import { Badge, Button, IconTile } from '../ui/index.js'
import { SESSION_FORMAT, TODAY } from '../../data/mockData.js'
import { formatCountdown, formatRelativeDay } from '../../lib/format.js'
import { sessionDateTime } from '../../lib/schedule.js'
import { STATUS_TONE } from '../../lib/tones.js'
import { SessionRow } from './SessionRow.jsx'

/**
 * One upcoming session. The first row is the hero — the design headlines the
 * next session as a dark card with its own Join button, the same treatment
 * Overview's hero gives it, so the two screens agree on what "next" looks like.
 */
export function UpcomingRow({ booking, hero, onJoin, onMove, onCancel }) {
  const start = sessionDateTime(booking.date, booking.time)
  /* Join unlocks 10 minutes before the start — Overview's rule, kept here so
     the same session is joinable from both screens at the same moment. */
  const canJoin = start - TODAY <= 10 * 60000

  return (
    <SessionRow
      hero={hero}
      tile={
        /* IconTile's tones are all light washes for white grounds, so the hero
           tile is rolled by hand: the accent seed at 15% with an accent glyph,
           mirroring IconTile's lg geometry. */
        hero ? (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[15px] bg-accent/15">
            <Icon name="calendar" className="size-5 text-accent" strokeWidth={1.9} />
          </span>
        ) : (
          <IconTile name="calendar" tone="brand" size="lg" />
        )
      }
      title={
        <>
          {formatRelativeDay(booking.date, TODAY)} · {booking.time}
        </>
      }
      subtitle={
        <>
          {SESSION_FORMAT.minutes} min · {SESSION_FORMAT.mode} · {formatCountdown(start, TODAY)}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {hero ? (
          /* Badge's dot variant sits on bg-surface-2 — invisible here, so the
             chip is hand-rolled on the accent wash the design uses. */
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-[13px] font-medium text-on-brand-light">
            <span className="size-1.75 shrink-0 rounded-full bg-accent" />
            {booking.status}
          </span>
        ) : (
          <Badge dot tone={STATUS_TONE[booking.status] ?? 'neutral'}>
            {booking.status}
          </Badge>
        )}

        {hero && (
          <Button variant="accent" size="sm" disabled={!canJoin} onClick={onJoin}>
            Join
          </Button>
        )}
        <Button variant={hero ? 'onDarkGhost' : 'outline'} size="sm" onClick={onMove}>
          Move
        </Button>
        <Button variant={hero ? 'dangerOnDark' : 'danger'} size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </SessionRow>
  )
}
