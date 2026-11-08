import { Card } from '../../../components/ui/index.js'

/** A card on the member page: a 26px title with a short line under it, then its body and buttons. */
export function Panel({ title, sub, aside, children, className }) {
  return (
    <Card as="section" padding="none" className={`flex min-w-0 animate-rise flex-col gap-5 px-6 py-6 ${className ?? ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-h2 text-ink">{title}</h2>
          {sub && <p className="text-[13px] text-muted">{sub}</p>}
        </div>
        {aside}
      </div>
      {children}
    </Card>
  )
}

/** The buttons at the bottom of a card. */
export function PanelActions({ children }) {
  return <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4.5">{children}</div>
}
