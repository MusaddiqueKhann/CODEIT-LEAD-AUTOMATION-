import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { cx } from '../../../components/ui/index.js'
import { TONES } from '../../../components/tones.js'

/** A white tile with a tinted icon: what it counts, the number, and a line of who or what. */
export function IconTile({ to, icon, tone, label, big, sub, index }) {
  return (
    <Link
      to={to}
      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
      className="flex animate-rise items-center gap-4 rounded-tile bg-panel px-5.5 py-5 text-ink shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span className={cx('grid size-12 shrink-0 place-items-center rounded-2xl', TONES[tone].fill, TONES[tone].text)}>
        <Icon name={icon} className="size-5" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-[13px] text-muted">{label}</span>
        <span className="text-tile">{big}</span>
        <span className="truncate text-xs text-muted">{sub}</span>
      </span>
    </Link>
  )
}
