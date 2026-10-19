import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { IconTile } from '../ui/IconTile.jsx'
import { Popover } from '../ui/Popover.jsx'
import { cx } from '../../lib/cx.js'
import { useDismiss } from '../../hooks/useDismiss.js'
import { useBookings } from '../../context/BookingContext.jsx'
import { formatShort } from '../../lib/format.js'
import { NAV_ITEMS, ROUTES } from '../../lib/nav.js'

export function SearchBox() {
  const navigate = useNavigate()
  const { bookings } = useBookings()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const pages = NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q)).map((item) => ({
      key: `page-${item.key}`,
      icon: item.icon,
      label: item.label,
      hint: 'Page',
      to: item.path,
    }))

    // Sessions are identified by date, so that is what's matched and shown.
    const sessions = bookings
      .filter((b) => `${b.title} ${formatShort(b.date)}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((b) => ({
        key: `booking-${b.id}`,
        icon: 'calendar',
        label: formatShort(b.date),
        hint: `${b.time} · ${b.status}`,
        to: b.upcoming ? ROUTES.bookings : ROUTES.feedback,
      }))

    return [...pages, ...sessions].slice(0, 8)
  }, [bookings, query])

  const select = (result) => {
    navigate(result.to)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative max-lg:hidden" ref={ref}>
      <div
        className={cx(
          'flex w-55 items-center gap-2.5 rounded-[10px] border bg-panel px-3.5 py-2.5 transition',
          open ? 'border-brand-500' : 'border-line',
        )}
      >
        <Icon name="search" className="size-4 shrink-0 text-faint" strokeWidth={1.9} />
        <input
          value={query}
          placeholder="Search"
          aria-label="Search"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results.length) select(results[0])
          }}
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
        />
      </div>

      {open && query.trim() && (
        <Popover>
          {results.length === 0 ? (
            <p className="px-4 py-5 text-center text-[13px] text-muted">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            results.map((result) => (
              <button
                key={result.key}
                type="button"
                onClick={() => select(result)}
                className="flex w-full items-center gap-3 border-b border-line-soft px-4 py-3 text-left transition last:border-0 hover:bg-surface"
              >
                <IconTile name={result.icon} tone="neutral" size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">
                    {result.label}
                  </span>
                  <span className="block truncate text-xs text-muted">{result.hint}</span>
                </span>
              </button>
            ))
          )}
        </Popover>
      )}
    </div>
  )
}
