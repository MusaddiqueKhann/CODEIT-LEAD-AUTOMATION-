import { cx } from '@/components'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { weekdayNames } from '../../../models/rules/format.js'
import { SessionAvatar } from './SessionAvatar.jsx'

/**
 * The month in boxes: each day shows its first two items (sessions or tasks; `count(n)` says how
 * many, `chip(item)` words them) and how many more; a click lists them all.
 */
export function MonthGrid({ anchor, cells, today, itemsOn, count, chip, onDay }) {
  const { t } = useLang()
  return (
    <div className="flex h-full min-w-225 flex-col gap-2 p-3">
      <div className="grid grid-cols-7 gap-2 px-1">
        {weekdayNames().map((w) => (
          <span key={w} className="px-2 py-1.5 text-xs tracking-[0.12em] text-faint uppercase">
            {w}
          </span>
        ))}
      </div>
      <div className="grid flex-1 auto-rows-[minmax(118px,1fr)] grid-cols-7 gap-2">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === anchor.getMonth()
          const isToday = +d === +today
          const items = inMonth ? itemsOn(d) : []
          return (
            <div
              key={+d}
              onClick={() => items.length && onDay(d)}
              style={{ animationDelay: `${0.05 + i * 0.012}s` }}
              className={cx(
                'flex min-w-0 animate-rise flex-col gap-2 rounded-[18px] px-2.5 pt-2.5 pb-2 transition-colors',
                !inMonth ? 'bg-brand-wash-2 opacity-50' : isToday ? 'bg-brand-50' : 'bg-surface-2',
                items.length > 0 && 'cursor-pointer hover:bg-brand-bubble',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cx('grid size-7.5 place-items-center rounded-[10px] text-sm', isToday ? 'bg-brand-700 text-white' : inMonth ? 'text-ink' : 'text-ghost')}>
                  {d.getDate()}
                </span>
                {items.length > 0 && <span className="text-[11px] text-muted">{count(items.length)}</span>}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                {items.slice(0, 2).map((s) => (
                  <span key={s.id} className="flex h-6.5 min-w-0 items-center gap-1.5 rounded-full bg-panel ps-0.75 pe-2 text-xs text-ink shadow-[0_2px_6px_-3px_rgb(30_50_80/0.18)]">
                    <SessionAvatar item={s} className="size-5 text-[8px]" />
                    <span className="truncate">{chip(s)}</span>
                  </span>
                ))}
              </div>
              {items.length > 2 && (
                <span className="mt-auto flex h-7 items-center justify-center rounded-full bg-tint px-2.5 text-xs text-brand-800">{t('shared.calendar.more', { n: items.length - 2 })}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
