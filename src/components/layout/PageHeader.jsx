import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button.jsx'
import { NotificationsBell } from './NotificationsBell.jsx'
import { SearchBox } from './SearchBox.jsx'
import { ROUTES } from '../../lib/nav.js'

/**
 * Page title + global chrome, rendered by every screen.
 *
 * Its own module now. It used to be exported from AppShell.jsx, so every page
 * imported a 372-line layout file — including the shell, the drawer and the
 * toast stack — to render a heading.
 *
 * `action` replaces the default "Book a session" button; pass `action={null}`
 * on the booking page itself, where offering it again is noise.
 */
export function PageHeader({ title, subtitle, action }) {
  const navigate = useNavigate()

  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        {/* The one place the display face appears: Manrope at the design's
            weight 800. tracking-tight is already the design's -0.025em. */}
        <h1 className="font-display text-[30px] leading-tight font-extrabold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <SearchBox />
        <NotificationsBell />

        {action === undefined ? (
          <Button icon="plus" onClick={() => navigate(ROUTES.book)} className="max-sm:hidden">
            Book a session
          </Button>
        ) : (
          action
        )}
      </div>
    </div>
  )
}
