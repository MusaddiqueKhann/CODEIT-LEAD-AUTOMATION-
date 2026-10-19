import { Badge, Card } from '../ui/index.js'
import { SESSION_BUNDLES } from '../../data/mockData.js'
import { formatMoney } from '../../lib/format.js'

/**
 * A top-up option. Priced as a table, so the bundle discount is explicit.
 *
 * A card that is also the control: rendered through Card `as="button"` so the
 * selected and idle surfaces stay card surfaces, with `aria-pressed` carrying
 * the state for assistive tech.
 */
export function BundleCard({ bundle, selected, onSelect }) {
  const perSession = Math.round(bundle.price / bundle.sessions)
  const saving = SESSION_BUNDLES[0].price * bundle.sessions - bundle.price

  return (
    <Card
      as="button"
      type="button"
      padding="sm"
      onClick={() => onSelect(bundle.id)}
      aria-pressed={selected}
      surface={
        selected
          ? 'border-brand-700 bg-tint'
          : 'border-line bg-panel hover:border-brand-300 hover:bg-surface'
      }
      className="flex flex-col items-start text-left transition"
    >
      <div className="flex w-full items-center justify-between gap-2">
        <p className="text-[15px] font-bold text-ink">{bundle.label}</p>
        {saving > 0 && (
          <Badge tone="success" size="sm">
            save {formatMoney(saving)}
          </Badge>
        )}
      </div>
      <p className="mt-2 text-[22px] leading-none font-bold text-ink">{formatMoney(bundle.price)}</p>
      <p className="mt-1.5 text-xs text-muted">{formatMoney(perSession)} per session</p>
    </Card>
  )
}
