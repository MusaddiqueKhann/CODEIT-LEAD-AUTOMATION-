import { cx } from '../../lib/cx.js'

/**
 * A segmented switch between views of the same list.
 *
 * Implements the ARIA tablist keyboard contract — arrows move between tabs,
 * Home/End jump to the ends — because a bare row of buttons makes a keyboard
 * user tab through every option to reach the panel.
 *
 * `items` is [{ key, label, count }]. The count renders as a pill so "Past (3)"
 * doesn't have to be baked into the label string.
 *
 * `size="sm"` is for a tablist living inside a card header next to other
 * text — the booking page's part-of-day filter — where the default control
 * is tall enough to wrap the header onto a second line.
 */
const SIZES = {
  md: { pad: 'p-1', tab: 'gap-2 rounded-[9px] px-4 py-2 text-[13px]' },
  /* Tight enough to share one line with a card heading — the booking page's
     filter sits beside "Monday, 20 July 2026" without wrapping the header. */
  sm: { pad: 'p-0.5', tab: 'gap-1 rounded-[7px] px-2.5 py-0.5 text-[11px]' },
}

export function Tabs({ items, value, onChange, size = 'md', className }) {
  const onKeyDown = (e) => {
    const i = items.findIndex((t) => t.key === value)
    if (i < 0) return

    const next =
      e.key === 'ArrowRight' ? (i + 1) % items.length
      : e.key === 'ArrowLeft' ? (i - 1 + items.length) % items.length
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
        'inline-flex gap-1 rounded-xl border border-line bg-panel',
        SIZES[size].pad,
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
              'inline-flex items-center justify-center transition',
              SIZES[size].tab,
              // Same reasoning as the sidebar's active item: the resting label
              // is --ink, so the active one has to move DOWN the ramp to stay
              // dominant. brand-900 is 8.4:1 and holds the top.
              active
                ? 'bg-tint font-semibold text-brand-900'
                : 'font-medium text-muted hover:bg-surface hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cx(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                  active ? 'bg-brand-800 text-white' : 'bg-surface-2 text-muted',
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
