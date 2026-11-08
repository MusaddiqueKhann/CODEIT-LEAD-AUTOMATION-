/**
 * The route table: the single source for paths, the sidebar and who may open what. An entry's
 * name is shared.layout.nav.<key> in the content files.
 *
 * `roles` lists the roles that see the entry; the sidebar shows only those, and a route the role
 * can't open sends them to Overview. `section` is the sidebar group ('primary' is the big button
 * above the groups); `badge` names the count
 * (from the server's my_counts) shown beside it. Adding a page means one entry
 * here plus the page in its portal's file in routes/ (shared.js, admin.js…). (The server still checks every action on its own; this
 * only decides what is shown.)
 */
const EVERYONE = ['admin', 'sales', 'account', 'integration', 'onboarding']
const TEAM = ['sales', 'account', 'integration', 'onboarding']

export const NAV = [
  { key: 'overview', path: '/', icon: 'overview', section: 'menu', roles: EVERYONE },
  { key: 'tasks', path: '/tasks', icon: 'checkCircle', section: 'menu', roles: TEAM, badge: 'waiting' },
  { key: 'calendar', path: '/calendar', icon: 'calendar', section: 'menu', roles: EVERYONE, badge: 'sessions_today' },
  { key: 'members', path: '/members', icon: 'users', section: 'menu', roles: EVERYONE, badge: 'late' },
  { key: 'addMember', path: '/add-member', icon: 'userPlus', section: 'primary', roles: ['admin', 'sales'] },
  { key: 'team', path: '/team', icon: 'team', section: 'menu', roles: ['admin'], badge: 'on_leave' },
  { key: 'alerts', path: '/alerts', icon: 'bell', section: 'personal', roles: EVERYONE, badge: 'unread' },
  { key: 'settings', path: '/settings', icon: 'settings', section: 'personal', roles: EVERYONE },
]

/** The sidebar's groups; their names are shared.layout.sections.<key> in the word files. */
export const SECTIONS = [{ key: 'menu' }, { key: 'personal' }]

/** Named paths, so call sites navigate to ROUTES.calendar rather than a bare string. */
export const ROUTES = Object.fromEntries(NAV.map((item) => [item.key, item.path]))

/** Public pages, outside the sidebar shell. */
export const PUBLIC = { login: '/login', forgot: '/forgot', setPassword: '/set-password', after: '/after/:token' }

export const memberPath = (code) => `${ROUTES.members}/${code}`
export const personPath = (id) => `${ROUTES.team}/${id}`
/** The Admin's company settings, under Settings in the sidebar. */
export const COMPANY_SETTINGS = `${ROUTES.settings}/company`
/** Its sections, in page order; each opens alone at ?part=<id> (names: admin.settings.sections.<id>.title). */
export const COMPANY_PARTS = ['timing', 'week', 'holidays', 'lists', 'docs', 'texts', 'company', 'history']

export const navFor = (role) => NAV.filter((item) => item.roles.includes(role))
