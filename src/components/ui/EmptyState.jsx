import { Card } from './Card.jsx'
import { IconTile } from './IconTile.jsx'
import { cx } from '../../lib/cx.js'

/**
 * The "nothing here yet" surface.
 *
 * Every list in the app can be empty on first load, and each one was otherwise
 * going to grow its own centred paragraph. `inset` renders without the card
 * chrome, for when the empty state already sits inside a Card.
 */
export function EmptyState({ icon, title, description, action, inset = false, className }) {
  const body = (
    <div className="flex flex-col items-center px-6 py-9 text-center">
      {icon && <IconTile name={icon} size="lg" tone="neutral" />}
      {/* The title names the state rather than describing it, so it stays ink
          and the explanation below carries --muted. */}
      {title && <p className="mt-4 text-[15px] font-semibold text-ink">{title}</p>}
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )

  if (inset) return <div className={className}>{body}</div>
  return <Card padding="none" className={cx(className)}>{body}</Card>
}
