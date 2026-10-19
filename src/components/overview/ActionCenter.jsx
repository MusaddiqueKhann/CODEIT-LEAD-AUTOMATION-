import { useNavigate } from 'react-router-dom'
import { Button, SectionHeader, cx } from '../ui/index.js'
import { useBookings } from '../../context/BookingContext.jsx'
import { ROUTES } from '../../lib/nav.js'
import { ROW_WASH, TONE_DOT, TONES } from '../../lib/tones.js'

/**
 * The "to-do" roll-up — every open loop that lives elsewhere, gathered so the
 * client never has to hunt for it. Each row derives from context state, so it
 * appears exactly when it is true and clears itself when the underlying thing
 * is done: a dot, the claim, and one action word — the row itself navigates.
 */
export function ActionCenter() {
  const { awaitingFeedback, paymentStatus, totalAvailable } = useBookings()
  const navigate = useNavigate()

  const items = []
  if (awaitingFeedback.length) {
    items.push({
      key: 'feedback',
      tone: 'brand',
      title:
        awaitingFeedback.length === 1
          ? 'Rate your last session'
          : `Rate ${awaitingFeedback.length} sessions`,
      action: 'Rate',
      to: ROUTES.feedback,
    })
  }
  if (paymentStatus === 'pending') {
    items.push({
      key: 'payment',
      tone: 'warn',
      title: 'Payment under review',
      action: 'Details',
      to: ROUTES.payments,
    })
  }
  if (totalAvailable <= 1) {
    items.push({
      key: 'low',
      tone: 'warn',
      title: totalAvailable === 0 ? 'No sessions left to book' : 'Only one session left',
      action: 'Top up',
      to: ROUTES.payments,
    })
  }

  if (!items.length) return null

  return (
    <section>
      <SectionHeader title="Needs your attention" className="mb-3" />
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <Button
            key={item.key}
            variant="bare"
            onClick={() => navigate(item.to)}
            className={cx(
              'flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-4.5 text-left transition',
              ROW_WASH[item.tone] ?? ROW_WASH.brand,
            )}
          >
            <span className="flex min-w-0 items-center gap-3.5">
              <span
                className={cx('size-2 shrink-0 rounded-full', TONE_DOT[item.tone] ?? TONE_DOT.brand)}
              />
              <span className="truncate text-[15px] font-bold text-ink">{item.title}</span>
            </span>
            <span
              className={cx(
                'shrink-0 text-sm font-semibold',
                TONES[item.tone]?.text ?? TONES.brand.text,
              )}
            >
              {item.action}
            </span>
          </Button>
        ))}
      </div>
    </section>
  )
}
