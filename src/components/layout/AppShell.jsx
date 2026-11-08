import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { Avatar } from '../ui/Avatar.jsx'
import { Sidebar } from './Sidebar.jsx'
import { Toasts } from './Toasts.jsx'
import { useAuth } from '../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { useAlertToasts } from '../../controllers/shared/useAlertToasts.js'
import { useCounts } from '../../controllers/shared/useCounts.js'
import { ROUTES } from '../../routes/paths.js'
import { initials } from '../../models/rules/time.js'

/** The frame: the floating sidebar, the mobile drawer, the page column and the toast stack. */
export function AppShell({ children }) {
  const { brand } = useConfig()
  const { t } = useLang()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile } = useAuth()
  const counts = useCounts(profile.id)
  useAlertToasts(profile.id)
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
          aria-label={t('layout.openNav')}
          className="rounded-lg p-2 text-ink transition hover:bg-surface-2"
        >
          <Icon name="menu" className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/CompanyLogo/Codeit-flat.png" alt={brand.app} className="h-10 w-auto" />
        </div>
        <Link to={ROUTES.alerts} aria-label={counts.unread ? t('layout.alertsLabel', { n: counts.unread }) : t('layout.nav.alerts')} className="relative ms-auto rounded-lg p-2 text-ink transition hover:bg-surface-2">
          <Icon name="bell" className="size-5" />
          {counts.unread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand-700 px-1 text-[10px] font-medium text-white">
              {counts.unread}
            </span>
          )}
        </Link>
        <Avatar initials={initials(profile.name)} src={profile.avatarUrl} size="sm" />
      </header>

      {/* The design's frame: a 16px gutter all round, the sidebar a floating 268px card that stays
          put while the page scrolls, and the page a column of white cards up to 1440px wide. */}
      <div className="flex items-start gap-4 lg:p-4">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-62 shrink-0 overflow-hidden rounded-[28px] lg:block">
          <Sidebar counts={counts} />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label={t('layout.closeNav')}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 start-0 w-72 max-w-[85vw] overflow-y-auto bg-shell shadow-2xl">
              <Sidebar counts={counts} onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex min-w-0 max-w-360 flex-1 flex-col gap-4 p-4 lg:min-h-[calc(100vh-2rem)] lg:p-0">{children}</main>
      </div>

      <Toasts />
    </div>
  )
}
