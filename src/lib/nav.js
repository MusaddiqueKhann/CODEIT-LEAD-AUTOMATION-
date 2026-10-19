/**
 * The route table — the single source for paths, the sidebar rail and global
 * search.
 *
 * `path` is what react-router and every <NavLink> use; `key` survives as a
 * stable React key and as the lookup behind ROUTES. Adding a page means one
 * entry here plus one <Route> in app/routes.jsx, and it appears in the rail and
 * in search automatically.
 */

export const PRIMARY_NAV = [
  { key: 'overview', path: '/', label: 'Overview', icon: 'overview' },
  { key: 'book', path: '/book', label: 'Book a session', icon: 'calendarPlus' },
  { key: 'bookings', path: '/bookings', label: 'My bookings', icon: 'bookings' },
  { key: 'payments', path: '/payments', label: 'Payments', icon: 'wallet' },
  { key: 'feedback', path: '/feedback', label: 'Feedback', icon: 'chat' },
  { key: 'profile', path: '/profile', label: 'Profile', icon: 'user' },
]

/**
 * Routes that exist but are not advertised in the sidebar. The Aqua·Mist
 * reference is for the team, not for trainees, so it is reachable by global
 * search ("design system", "palette", "color") and by direct URL — never as a
 * rail item.
 */
export const HIDDEN_NAV = [
  { key: 'palette', path: '/palette', label: 'Design system · Color palette', icon: 'sun' },
]

/** Sidebar renders PRIMARY only; search covers hidden routes too. */
export const NAV_ITEMS = [...PRIMARY_NAV, ...HIDDEN_NAV]

/** Named paths, so call sites navigate to ROUTES.book rather than a bare string. */
export const ROUTES = Object.fromEntries(NAV_ITEMS.map((item) => [item.key, item.path]))
