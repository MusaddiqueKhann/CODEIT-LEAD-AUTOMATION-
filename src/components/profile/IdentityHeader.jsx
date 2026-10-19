import { Avatar, Card } from '../ui/index.js'
import { useBookings } from '../../context/BookingContext.jsx'
import { user } from '../../data/mockData.js'

/**
 * The identity banner that opens the page.
 *
 * A horizontal strip rather than the centred sidebar card the two-column layout
 * used: with no rail to anchor it, the disc sits beside the name and the facts
 * that were a stacked list collapse into one meta line, since "plan · member ·
 * attended" reads as a caption, not a table worth its own column.
 */
export function IdentityHeader() {
  const { allowance } = useBookings()

  const meta = [
    `Member since ${user.memberSince}`,
    `${allowance.attended} sessions attended`,
  ].join(' · ')

  return (
    <Card
      padding="lg"
      surface="border-transparent bg-panel"
      className="flex items-center gap-5 shadow-sm"
    >
      <Avatar initials={user.initials} size="lg" />
      <div className="min-w-0">
        <p className="text-xl font-bold tracking-tight text-ink">{user.name}</p>
        <p className="mt-1 text-sm text-muted">{meta}</p>
      </div>
    </Card>
  )
}
