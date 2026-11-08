import { COMPANY_SETTINGS, ROUTES, memberPath, navFor } from './paths.js'
import { STEPS } from '../models/rules/stages.js'

/* A member's tabs, and the teams the sidebar filters by, in its order; their names come from Settings → Lists. */
const TABS = ['', ...STEPS]
const TEAMS = ['admin', 'sales', 'account', 'onboarding', 'integration']
const TASK_STEPS = ['sales', 'setup', 'integration', 'onboarding']
const OTHER_STEPS = ['sales', 'setup', 'integration']
/* Company settings' pages in the sidebar, grouped by what they're about (layout.tree.companyGroups.<group>);
   a group of one is just its page. Their order on the full page is COMPANY_PARTS. */
const COMPANY_TREE = [
  ['scheduling', ['timing', 'week', 'holidays']],
  ['memberSetup', ['lists', 'docs']],
  [null, ['texts']],
  ['company', ['company', 'history']],
]

const leaf = (key, label, to) => ({ key, label, to })
const group = (key, label, children) => ({ key, label, children: children.filter(Boolean) })
/** A page that also lists things under it (All members and the members opened from it). */
const page = (key, label, to, children) => ({ key, label, to, children })

/**
 * The sidebar for one role, as a tree. A node with only `to` opens a page; a node with only
 * `children` opens or closes its list; a node with both opens its page and shows its list.
 * Top-level nodes carry their NAV entry's icon, badge and section. `opened` are the members this
 * person opened (newest first): each shows under My members if they are on it, else All members.
 * `types` are the business types; `label`, `meta` and `t` give the words in the reader's language.
 */
export function sidebarTree({ role, me, opened, label, meta, t, types }) {
  const admin = role === 'admin'
  const isMine = (m) => !admin && [m.salesId, m.accountPersonId, m.integrationId, m.onboardingId].includes(me)
  const memberRows = (prefix, list) =>
    list.map((m) =>
      group(
        `${prefix}:${m.code}`,
        m.name,
        // A member with no integrations has no Integration tab to open.
        TABS.filter((tab) => tab !== 'integration' || m.integrations?.length).map((tab) => leaf(`${prefix}:${m.code}:${tab}`, tab ? label('step', tab) : t('layout.tree.overview'), tab ? `${memberPath(m.code)}?tab=${tab}` : memberPath(m.code))),
      ),
    )
  const M = ROUTES.members

  const children = {
    tasks: [
      leaf('tasks:all', t('layout.tree.allTasks'), ROUTES.tasks),
      group('tasks:filter', t('layout.tree.filter'), TASK_STEPS.map((s) => leaf(`tasks:${s}`, label('step', s), `${ROUTES.tasks}?step=${s}`))),
    ],
    calendar: [
      !admin && leaf('cal:mine', t(role === 'onboarding' ? 'layout.tree.mySessions' : 'layout.tree.myMembers'), ROUTES.calendar),
      leaf('cal:all', t('layout.tree.onboardingSessions'), admin ? ROUTES.calendar : `${ROUTES.calendar}?who=all`),
      group('cal:filter', t('layout.tree.filter'), [
        leaf('cal:other', t('layout.tree.allSteps'), `${ROUTES.calendar}?mode=other`),
        ...OTHER_STEPS.map((s) => leaf(`cal:${s}`, label('step', s), `${ROUTES.calendar}?mode=other&step=${s}`)),
      ]),
    ],
    members: [
      !admin && page('mem:mine', t('layout.tree.myMembers'), `${M}?show=mine`, memberRows('mine', opened.filter(isMine))),
      page('mem:all', t('layout.tree.allMembers'), M, memberRows('all', opened.filter((m) => !isMine(m)))),
      group('mem:step', t('layout.tree.byStep'), [leaf('mem:step:all', t('layout.tree.allSteps'), `${M}?step=`), ...[...STEPS, 'closed'].map((s) => leaf(`mem:step:${s}`, label('step', s), `${M}?step=${s}`))]),
      group('mem:type', t('layout.tree.byType'), [
        leaf('mem:type:all', t('layout.tree.allTypes'), `${M}?plan=`),
        ...types.map((o) => leaf(`mem:type:${o.key}`, label('business_type', o.key), `${M}?plan=${o.key}`)),
      ]),
      group('mem:team', t('layout.tree.byTeam'), [
        leaf('mem:team:all', t('layout.tree.allTeams'), `${M}?team=`),
        ...TEAMS.map((r) => leaf(`mem:team:${r}`, meta('role', r, 'team') || label('role', r), `${M}?team=${r}`)),
      ]),
    ],
    settings: [
      leaf('set:personal', t('layout.tree.personalSettings'), `${ROUTES.settings}?part=personal`),
      admin &&
        group(
          'set:company',
          t('layout.tree.companySettings'),
          COMPANY_TREE.flatMap(([name, parts]) => {
            const pages = parts.map((part) =>
              leaf(`set:company:${part}`, part === 'company' ? t('layout.tree.companyDetails') : t(`settings.sections.${part}.title`), `${COMPANY_SETTINGS}?part=${part}`),
            )
            return name ? [group(`set:company:${name}`, t(`layout.tree.companyGroups.${name}`), pages)] : pages
          }),
        ),
    ],
  }

  return navFor(role)
    .filter((item) => item.section !== 'primary')
    .map((item) => ({
      key: item.key,
      label: t(`layout.nav.${item.key}`),
      icon: item.icon,
      badge: item.badge,
      section: item.section,
      ...(children[item.key] ? { children: children[item.key].filter(Boolean) } : { to: item.path }),
    }))
}

/** The keys of the groups that lead to the page at `here` (path + search), so they open on arrival. */
export function trailTo(nodes, here) {
  for (const node of nodes) {
    if (node.to === here) return []
    if (node.children) {
      const below = trailTo(node.children, here)
      if (below) return [node.key, ...below]
    }
  }
  return null
}
