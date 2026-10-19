import { cx } from '../../lib/cx.js'

/**
 * The eyebrow-plus-action row that titles a block inside a page.
 *
 * Distinct from PageHeader: that one owns the page's h1 and the global chrome
 * (search, bell). This is the smaller heading that sits above a list, so its
 * title renders as h2 and takes the eyebrow treatment rather than display size.
 */
export function SectionHeader({ title, count, action, className }) {
  return (
    <div className={cx('flex items-center justify-between gap-4', className)}>
      {/* Section titles *name* the data below them, so by the rule in index.css
          they take --muted rather than --faint. `count`, when given, rides
          alongside as a small brand chip — "how many" without reading the list.
          tracking-normal so it drops the eyebrow's wide letter-spacing. */}
      <h2 className="eyebrow flex items-center gap-2 text-muted">
        {title}
        {count > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-100 px-1 text-[10px] font-medium tracking-normal text-brand-800">
            {count}
          </span>
        )}
      </h2>
      {action}
    </div>
  )
}
