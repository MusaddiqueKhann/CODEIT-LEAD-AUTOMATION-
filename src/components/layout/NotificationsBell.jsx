import { useState } from 'react'
import Icon from '../Icon.jsx'
import { IconTile } from '../ui/IconTile.jsx'
import { Popover } from '../ui/Popover.jsx'
import { cx } from '../../lib/cx.js'
import { useDismiss } from '../../hooks/useDismiss.js'
import { useNotifications } from '../../context/NotificationContext.jsx'
import { NOTIFICATION_KINDS } from '../../data/mockData.js'

export function NotificationsBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))

  return (
    <div className="relative max-sm:hidden" ref={ref}>
      <button
        type="button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'relative flex size-10 items-center justify-center rounded-[10px] border transition',
          open
            ? 'border-tint-line bg-tint text-brand-700'
            : 'border-line bg-panel text-muted hover:bg-surface',
        )}
      >
        <Icon name="bell" className="size-4.5" />
        {unreadCount > 0 && (
          /* The unread dot is a pure signal, so it takes Primary rather than
             ink — it needs to read as "something new", not as punctuation. */
          <span className="absolute top-2.5 right-2.5 size-1.75 rounded-full bg-brand-700 ring-2 ring-panel" />
        )}
      </button>

      {open && (
        <Popover>
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-[13px] font-semibold text-ink">
              Notifications
              {unreadCount > 0 && <span className="ml-1.5 text-muted">({unreadCount} new)</span>}
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-ink transition hover:text-brand-700"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="scrollbar-slim max-h-96 overflow-y-auto">
            {notifications.map((n) => {
              const kind = NOTIFICATION_KINDS[n.kind] ?? NOTIFICATION_KINDS.account
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={cx(
                    'flex w-full gap-3 border-b border-line-soft px-4 py-3.5 text-left transition last:border-0',
                    n.read ? 'hover:bg-surface' : 'bg-tint',
                  )}
                >
                  <IconTile name={kind.icon} tone={kind.tone} size="sm" />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      {/* Both states sit at --ink; unread is carried by weight
                          and the tint fill, not by dimming the read ones. */}
                      <span
                        className={cx(
                          'text-[13px] leading-snug text-ink',
                          n.read ? 'font-medium' : 'font-semibold',
                        )}
                      >
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-700" />
                      )}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">{n.body}</span>
                    <span className="mt-1.5 block font-mono text-[10px] tracking-wide text-faint uppercase">
                      {n.at}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </Popover>
      )}
    </div>
  )
}
