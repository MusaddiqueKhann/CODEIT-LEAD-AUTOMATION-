import { Card } from '../ui/Card.jsx'

/**
 * A form card: the title and its line over a rule, then its rows. `n` puts a numbered badge
 * before the title (Add a member counts its sections); `aside` sits at the end of the heading.
 * `id` lets a link or the Ready card jump to it.
 */
export function Section({ id, n, title, sub, aside, children }) {
  return (
    <Card as="section" id={id} padding="none" className="flex min-w-0 animate-rise scroll-mt-6 flex-col px-6 pt-6 pb-3">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-5">
        <div className="flex min-w-0 items-center gap-3.5">
          {n && <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-700 text-sm text-white">{n}</span>}
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-h2 text-ink">{title}</h2>
            <p className="text-[13px] text-muted">{sub}</p>
          </div>
        </div>
        {aside}
      </div>
      {children}
    </Card>
  )
}
