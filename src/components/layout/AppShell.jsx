import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { Avatar } from '../ui/Avatar.jsx'
import { cx } from '../../lib/cx.js'
import { Sidebar } from './Sidebar.jsx'
import { Toasts } from './Toasts.jsx'
import { user } from '../../data/mockData.js'

/**
 * The frame: rail, mobile drawer, content card, toast stack.
 *
 * Nothing else — the popovers, the page header and the toast rendering each
 * have their own module. This file was 372 lines holding five concerns; it is
 * now only the layout, so a change to the drawer can't touch search behaviour.
 */
export function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [pathname])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-shell">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-shell/85 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-ink transition hover:bg-surface-2"
        >
          <Icon name="menu" className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/CompanyLogo/Codeit-flat.png" alt="CODEIT" className="h-10 w-auto" />
        </div>
        <Avatar initials={user.initials} size="sm" className="ml-auto" />
      </header>

      <div className="flex">
        {/* Desktop sidebar. The rail is a brand-700 panel now, so its own fill
            does the separating — the border-line hairline it wore while white
            would just dirty the card's edge against the dark fill.

            Inset by the same lg:p-3 gutter the content already sits in, so all
            four sides clear the viewport edge and the panel reads as a floating
            card rather than a flush column.

            The radius lives on the wrapper, not on Sidebar itself — that
            component also renders as the mobile drawer, an overlay with its own
            shadow-2xl over a scrim, where a rounded corner would draw against
            the backdrop. overflow-hidden clips the rail's own scroll container
            to the radius. */}
        <aside className="sticky top-0 hidden h-screen w-68 shrink-0 lg:block lg:p-3 lg:pr-0">
          <div className="h-full overflow-hidden rounded-[26px]">
            <Sidebar />
          </div>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-shell shadow-2xl">
              <Sidebar onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        {/* The card is inset from the shell on desktop only — on mobile the
            gutter would eat too much of a narrow viewport, so it goes flush.
            Full p-3 now, including the left: the rail no longer runs flush to
            the content, so pl-0 would butt the page straight against the
            sidebar's new border instead of leaving it a gutter to sit in. */}
        <main className="min-w-0 flex-1 lg:p-3">
          <div
            className={cx(
              // Flat white, same as the shell behind it — the Cards inside are
              // separated by their own hairline rather than by a change in fill.
              'bg-canvas px-5 py-8 sm:px-8',
              'lg:min-h-[calc(100vh-1.5rem)] lg:rounded-[26px] lg:px-14 lg:py-11',
            )}
          >
            <div className="max-w-[1440px]">{children}</div>
          </div>
        </main>
      </div>

      <Toasts />
    </div>
  )
}
