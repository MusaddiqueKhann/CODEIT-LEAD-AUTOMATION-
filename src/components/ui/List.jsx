import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { cx } from '../cx.js'

/** A list's column names on a grey band. `columns` is the list's grid, shared with its rows. */
export function ListHead({ columns, className, children }) {
  return <div className={cx('ui-list-head', columns, 'h-12 rounded-2xl bg-field text-[13px] font-medium text-ink-2', className)}>{children}</div>
}

/**
 * One row of a list that opens something: a link on the list's grid (`columns`), a rule above
 * every row but the first, rising in after the one before it (`index`).
 */
export function ListRow({ id, to, columns, index, className, children }) {
  return (
    <Link
      id={id}
      to={to}
      style={{ animationDelay: `${0.12 + index * 0.04}s` }}
      className={cx('ui-list-row', columns, 'mx-3 animate-rise text-ink transition-colors hover:bg-wash', index > 0 && 'border-t border-line', className)}
    >
      {children}
    </Link>
  )
}

/** The arrow at the end of a row that opens. */
export function RowArrow() {
  return (
    <span className="ui-row-arrow grid size-9 place-items-center rounded-xl bg-surface text-soft">
      <Icon name="chevronRight" className="size-3.5" strokeWidth={2} />
    </span>
  )
}
