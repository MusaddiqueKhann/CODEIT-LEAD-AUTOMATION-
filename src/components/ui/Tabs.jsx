import { cx } from '../cx.js'

/**
 * A segmented switch between views of the same list.
 *
 * Implements the ARIA tablist keyboard contract — arrows move between tabs,
 * Home/End jump to the ends — because a bare row of buttons makes a keyboard
 * user tab through every option to reach the panel.
 *
 * `items` is [{ key, label, count }]. A count (zero included) renders as a pill after the label;
 * leave it out for a plain switch. The look is the design's: a grey track, the picked tab white.
 */
const SIZES = {
  md: 'h-9.5 text-sm',
  /* The calendar's Day / Week / Month switch. */
  sm: 'h-8.5 text-[13px]',
}

export function Tabs({ items, value, onChange, size = 'md', className }) {
  const onKeyDown = (e) => {
    const i = items.findIndex((t) => t.key === value)
    if (i < 0) return

    // In Arabic the tabs run right to left, so the arrow keys swap.
    const forward = document.documentElement.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const backward = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft'
    const next =
      e.key === forward ? (i + 1) % items.length
      : e.key === backward ? (i - 1 + items.length) % items.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1
      : null

    if (next === null) return
    e.preventDefault()
    onChange(items[next].key)
  }

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      className={cx(
        'inline-flex gap-1 rounded-[22px] bg-track p-1',
        className,
      )}
    >
      {items.map((tab) => {
        const active = tab.key === value
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            /* Only the active tab stays in the tab order; the arrow keys reach
               the rest. This is the roving-tabindex the tablist role expects. */
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.key)}
            className={cx(
              'inline-flex items-center justify-center gap-2.5 rounded-full whitespace-nowrap transition',
              SIZES[size],
              tab.count != null ? 'ps-4 pe-1.5' : 'px-4',
              active ? 'bg-panel text-ink shadow-tab' : 'text-soft hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cx(
                  'grid h-5.5 min-w-5.5 place-items-center rounded-full px-1.5 text-[11px] transition',
                  active ? 'bg-brand-900 text-white' : 'bg-chip text-soft',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
