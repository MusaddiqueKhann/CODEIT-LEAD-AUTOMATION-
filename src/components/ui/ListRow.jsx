import Icon from '../Icon.jsx'
import { IconTile } from './IconTile.jsx'
import { cx } from '../../lib/cx.js'
import { ROW_WASH } from '../../lib/tones.js'

/**
 * One row of a record list — icon tile, title, subtitle, trailing slot.
 *
 * Renders as a <button> when `onClick` is given and a plain <div> otherwise, so
 * a non-interactive row does not land in the tab order advertising an action it
 * does not have. When interactive it also gets the chevron and the hover fill.
 *
 * `washed` tints the row in its `tone` (its status colour) with a deeper hover,
 * in place of the neutral surface hover. The title/subtitle stay ink/muted —
 * the wash and the tone icon carry the colour, so every row's label reads at
 * the same weight.
 *
 * Wrap in <List> (below) rather than a bare <ul>: the divider and the corner
 * clipping belong to the container, not to each row.
 */
export function ListRow({ icon, tone = 'brand', washed = false, title, subtitle, trailing, onClick, className }) {
  const interactive = Boolean(onClick)
  const Tag = interactive ? 'button' : 'div'

  const fill = washed ? ROW_WASH[tone] ?? ROW_WASH.brand : interactive ? 'hover:bg-surface' : null

  return (
    <li className="border-b border-line-soft last:border-0">
      <Tag
        {...(interactive ? { type: 'button', onClick } : {})}
        className={cx('group flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition', fill, className)}
      >
        {icon && <IconTile name={icon} tone={tone} size="md" />}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-[13px] text-muted">{subtitle}</p>}
        </div>

        {trailing}

        {interactive && (
          <Icon
            name="chevronRight"
            className="size-4.5 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-muted"
          />
        )}
      </Tag>
    </li>
  )
}

/**
 * The <ul> that holds ListRows. Carries the card chrome itself, with
 * overflow-hidden so a row's hover fill is clipped to the radius rather than
 * squaring off the corners.
 */
export function List({ className, children }) {
  return (
    <ul className={cx('overflow-hidden rounded-2xl border border-line bg-panel', className)}>
      {children}
    </ul>
  )
}
