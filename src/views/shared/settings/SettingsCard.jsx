import { Card } from '../../../components/ui/index.js'

/** A settings card: a title and its line (with `aside` beside them), the body, and a footnote. */
export function SettingsCard({ title, sub, aside, note, children }) {
  return (
    <Card as="section" padding="none" className="flex min-w-0 animate-rise flex-col gap-5 px-6 py-6 [animation-delay:.08s]">
      {(title || aside) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            {title && <h2 className="text-h2 text-ink">{title}</h2>}
            {sub && <p className="text-[13px] text-muted">{sub}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
      {note && <p className="border-t border-line pt-4 text-[13px] text-muted">{note}</p>}
    </Card>
  )
}

/** The design's settings field grid: as many 220px-wide columns as fit. */
export const FIELDS = 'grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-4 gap-y-3.5'
