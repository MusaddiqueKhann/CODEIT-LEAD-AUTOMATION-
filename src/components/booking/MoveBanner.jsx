import Icon from '../Icon.jsx'
import { Button, Card } from '../ui/index.js'
import { formatShort } from '../../lib/format.js'

/**
 * The strip above the wizard while a session is being moved: which booking is
 * on the move, and the way out of the move. `from` is the booking being
 * rescheduled.
 */
export function MoveBanner({ from, onCancel }) {
  return (
    <Card
      padding="sm"
      surface="border-tint-line bg-tint"
      className="mb-6 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <Icon name="refresh" className="size-4.5 shrink-0 text-brand-700" />
        <p className="text-sm text-ink">
          Moving your session from{' '}
          <span className="font-semibold">
            {formatShort(from.date)}, {from.time}
          </span>
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel move
      </Button>
    </Card>
  )
}
