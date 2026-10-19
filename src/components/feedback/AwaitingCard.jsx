import { useState } from 'react'
import { Button, Card, Rating, Ring, Textarea } from '../ui/index.js'
import { RATING_ACCENT } from './ratingAccent.js'
import { SESSION_FORMAT } from '../../data/mockData.js'
import { formatMedium } from '../../lib/format.js'

/**
 * One unrated session — its own rating, hover and comment.
 *
 * State is per-card rather than lifted to the page: two sessions awaiting
 * feedback are two independent forms, and a shared draft would leak one
 * session's comment into the other's.
 */
export function AwaitingCard({ booking, onSubmit }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')

  /* What the ring and the boxes both fill to: the star under the pointer while
     hovering, otherwise the one that's been committed. */
  const shown = hover || rating
  const accent = RATING_ACCENT[shown] ?? RATING_ACCENT[5]

  return (
    <Card
      radius="rounded-3xl"
      padding="none"
      clip
      className="shadow-[0_20px_50px_-30px_rgba(18,48,51,0.3)]"
    >
      <div className="flex flex-col items-start gap-6 px-8 py-8 sm:flex-row sm:items-center sm:gap-8">
        <Ring
          value={shown}
          max={5}
          size={116}
          thickness={8}
          tone="warn"
          track="text-line"
          /* At 0 the round line-cap of the value arc renders as a dot; colour it
             like the track so the empty ring reads clean, amber once a star lands. */
          arc={RATING_ACCENT[shown]?.text ?? 'text-line'}
          label={`Rated ${rating} out of 5`}
        >
          {shown > 0 ? (
            <>
              <span className="text-3xl font-bold text-ink">{shown}</span>
              <span className="text-[11px] text-faint">out of 5</span>
            </>
          ) : (
            <span className="text-[11px] text-faint">out of 5</span>
          )}
        </Ring>

        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-muted">
            {formatMedium(booking.date)} · {booking.minutes ?? SESSION_FORMAT.minutes} min ·{' '}
            {SESSION_FORMAT.mode}
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">How was your session?</p>
          <div className="mt-4">
            <Rating
              boxed
              value={rating}
              onChange={setRating}
              onHover={setHover}
              fill={accent.text}
              boxFill={accent.box}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-surface px-8 py-6">
        {/* Textarea and button share one row; the field grows to fill and the
            button holds its natural width. !bg-panel forces the white fill past
            CONTROL's bg-surface default. */}
        <div className="flex items-start gap-3">
          <Textarea
            rows={1}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What worked, what didn’t…"
            aria-label="Feedback comment"
            className="flex-1 !bg-panel"
          />
          {/* A comment without a rating isn't feedback the trainer can act on, so
              the star is the required half, not the text. */}
          <Button
            className="shrink-0"
            disabled={rating === 0}
            onClick={() => onSubmit(booking.id, rating, comment.trim())}
          >
            Send feedback
          </Button>
        </div>
      </div>
    </Card>
  )
}
