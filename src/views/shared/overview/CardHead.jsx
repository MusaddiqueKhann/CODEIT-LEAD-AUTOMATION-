import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'

/** A card's title and line, with an outlined link to the page it summarises. */
export function CardHead({ title, sub, to, label }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-h2 text-ink">{title}</h2>
        {sub && <p className="text-[13px] text-muted">{sub}</p>}
      </div>
      {to && (
        <Link to={to} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] whitespace-nowrap text-ink ring-[1.5px] ring-edge transition ring-inset hover:bg-surface">
          {label}
          <Icon name="arrowUpRight" className="size-3" strokeWidth={1.8} />
        </Link>
      )}
    </div>
  )
}
