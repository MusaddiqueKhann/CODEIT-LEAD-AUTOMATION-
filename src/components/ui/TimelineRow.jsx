import { cx } from '../../lib/cx.js'

/**
 * One entry of a schedule timeline — the time stamped in the left gutter, a
 * vertical tick, and whatever the entry says in the remaining width. The
 * gutter is fixed-width so every tick down the page sits on one rail; `bar`
 * is the tick's colour class.
 */
export function TimelineRow({ time, day, bar, children }) {
  return (
    <li className="flex gap-5">
      <div className="w-16 shrink-0 pt-0.5 text-right">
        <p className="text-[15px] leading-tight font-bold text-ink">{time}</p>
        <p className="mt-0.5 text-xs text-faint">{day}</p>
      </div>
      <span className={cx('w-[3px] shrink-0 self-stretch rounded-full', bar)} />
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  )
}
