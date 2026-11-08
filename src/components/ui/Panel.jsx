import { cx } from '../cx.js'
import { Card } from './Card.jsx'

/**
 * A card with a heading: a 26px title with a short line under it (`aside` at the end), then its
 * body, and an optional footnote over a rule. The member page's cards and the settings cards.
 */
export function Panel({ id, title, sub, aside, note, children, className }) {
  return (
    <Card as="section" id={id} padding="none" className={cx('ui-panel flex min-w-0 animate-rise flex-col gap-5 px-6 py-6', className)}>
      {(title || aside) && (
        <div className="ui-panel__head flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title && <h2 className="ui-panel__title text-h2 text-ink">{title}</h2>}
            {sub && <p className="ui-panel__sub text-[13px] text-muted">{sub}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
      {note && <p className="ui-panel__note border-t border-line pt-4 text-[13px] text-muted">{note}</p>}
    </Card>
  )
}

/** The buttons at the bottom of a card. */
export function PanelActions({ children }) {
  return <div className="ui-panel__actions flex flex-wrap items-center gap-2 border-t border-line pt-4.5">{children}</div>
}
