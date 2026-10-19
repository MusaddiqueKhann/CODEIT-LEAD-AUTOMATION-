import Icon from '../Icon.jsx'
import { Card } from '../ui/index.js'

/**
 * The "transfer awaiting verification" notice.
 *
 * The prototype has no gateway, so the pending state is the whole point of the
 * Payments page rather than an edge case — it gets a banner, not a chip.
 */
export function PendingBanner() {
  return (
    <Card padding="sm" surface="border-warn/35 bg-warn/12" className="mb-6 flex items-start gap-3">
      <Icon name="clock" className="mt-0.5 size-4.5 shrink-0 text-[#b06e08]" />
      <div>
        <p className="text-sm font-semibold text-[#b06e08]">Transfer awaiting verification</p>
        <p className="mt-1 text-[13px] text-muted">
          An admin unlocks the session once your transfer is confirmed. You’ll get a
          notification here and by email.
        </p>
      </div>
    </Card>
  )
}
