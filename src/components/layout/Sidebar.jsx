import { useState } from 'react'
import { LOGO } from '../logo.js'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { cx } from '../cx.js'
import { useAuth } from '../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { useToast } from '../../controllers/shared/ToastContext.jsx'
import { dayKey, riyadhNow } from '../../models/rules/format.js'
import { PUBLIC, ROUTES, SECTIONS, navFor } from '../../routes/paths.js'
import { initials } from '../../models/rules/time.js'
import { LanguageSwitch } from './LanguageSwitch.jsx'
import { sidebarTree, trailTo } from '../../routes/sidebar.js'
import { useMembers } from '../../controllers/shared/useMembers.js'

/* The sidebar is a teal card, so every state is a white wash over it: hover white/12, the
   current page white/20. Rows sit on a black/8 box. The focus ring flips to white, or it would
   vanish into the panel. Sizes are the design's: 46px rows, 40px sub-rows, 20px counts. */
const ROW = 'flex h-10 w-full items-center gap-2.5 rounded-[11px] px-3 text-sm text-white transition hover:bg-white/12 focus-visible:outline-white'
const SUB_ROW = 'flex h-8.5 items-center gap-2 rounded-[10px] ps-3 pe-2 text-[13px] text-white transition hover:bg-white/10 focus-visible:outline-white'
const BADGE = 'grid h-5 min-w-5 place-items-center rounded-full bg-white/16 px-1.5 text-[11px] text-white/90'
const RULE = 'border-white/18'

function Chevron({ className }) {
  return <Icon name="chevronDown" strokeWidth={2} className={cx('size-3 shrink-0', className)} />
}

/**
 * One node of the sidebar tree. A group only opens or closes its list (the chevron turns); a page
 * is a real link, so middle-click works, and a page with a list (All members) shows it beneath.
 * `depth` 0 is a top row with its icon and badge.
 */
function Node({ node, depth, open, toggle, here, counts, onSelect }) {
  const top = depth === 0
  const badge = top && node.badge ? counts[node.badge] : 0
  const row = cx(top ? ROW : SUB_ROW, 'w-full text-start')
  const list = (children) => (
    <div className={cx('relative flex flex-col gap-0.5 pt-0.5 pb-1', top ? 'ps-9' : 'ps-3.5')}>
      <span aria-hidden="true" className={cx('absolute top-1 bottom-2 w-px bg-white/22', top ? 'inset-s-5.25' : 'inset-s-1.75')} />
      {children.map((child) => (
        <Node key={child.key} node={child} depth={depth + 1} open={open} toggle={toggle} here={here} counts={counts} onSelect={onSelect} />
      ))}
    </div>
  )

  if (node.children && !node.to) {
    const isOpen = open.has(node.key)
    return (
      <>
        <button id={`sidebar-${node.key.replaceAll(':', '-')}-group`} type="button" aria-expanded={isOpen} onClick={() => toggle(node.key)} className={cx('ui-sidebar__group', row, isOpen && top && 'bg-white/12')}>
          {top && <Icon name={node.icon} strokeWidth={1.7} className="size-4.5 shrink-0 opacity-95" />}
          <span className="min-w-0 flex-1 truncate">{node.label}</span>
          {badge > 0 && <span className={BADGE}>{badge}</span>}
          <Chevron className={cx('opacity-80 transition-transform', isOpen && 'rotate-180')} />
        </button>
        {isOpen && list(node.children)}
      </>
    )
  }

  // A top page is current under its own path too (/team/… is still Team); a sub-page only exactly.
  const [path] = node.to.split('?')
  const current = here === node.to || (top && path !== ROUTES.overview && here.split('?')[0].startsWith(`${path}/`))
  return (
    <>
      <Link id={`sidebar-${node.key.replaceAll(':', '-')}`} to={node.to} onClick={onSelect} aria-current={current ? 'page' : undefined} className={cx('ui-sidebar__item', row, current ? (top ? 'bg-white/20' : 'bg-white/16') : !top && 'opacity-88')}>
        {top && <Icon name={node.icon} strokeWidth={1.7} className="size-4.5 shrink-0 opacity-95" />}
        <span className="min-w-0 flex-1 truncate">{node.label}</span>
        {badge > 0 && <span className={BADGE}>{badge}</span>}
        {top && <Chevron className="opacity-25" />}
      </Link>
      {node.children?.length > 0 && list(node.children)}
    </>
  )
}

export function Sidebar({ onNavigate, counts = {} }) {
  const { toast } = useToast()
  const { profile, role, signOut } = useAuth()
  const { label, meta, leave, active, brand } = useConfig()
  const { t } = useLang()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const here = pathname + search
  // The members opened this visit, newest first, show in the sidebar with their tabs.
  // ponytail: kept for this visit only and capped at 5; save them to the profile if people want them back.
  const opening = /^\/members\/([^/]+)$/.exec(pathname)?.[1]
  const [codes, setCodes] = useState([])
  if (opening && codes[0] !== opening) setCodes([opening, ...codes.filter((c) => c !== opening)].slice(0, 5))
  const { data: members, reload } = useMembers()
  // A member added since the list loaded has no name yet: load the list again, once per code.
  const missing = members && codes.find((c) => !members.some((m) => m.code === c))
  const [asked, setAsked] = useState(null)
  if (missing && missing !== asked) {
    setAsked(missing)
    reload()
  }
  const opened = codes.map((c) => (members ?? []).find((m) => m.code === c)).filter(Boolean)
  const primary = navFor(role).find((item) => item.section === 'primary')
  const tree = sidebarTree({ role, me: profile.id, opened, label, meta, t, types: active('business_type') })

  // The groups leading to this page open on arrival (or once the member it shows is listed);
  // any group opens or closes on a click.
  const trail = trailTo(tree, here) ?? []
  const [open, setOpen] = useState(() => new Set(trail))
  const [seen, setSeen] = useState(trail.join('>'))
  if (seen !== trail.join('>')) {
    setSeen(trail.join('>'))
    setOpen((o) => new Set([...o, ...trail]))
  }
  const toggle = (key) =>
    setOpen((o) => {
      const next = new Set(o)
      if (next.has(key)) next.delete(key)
      else {
        // Company settings' sub-menus open one at a time, so the sidebar stays short.
        if (key.startsWith('set:company:')) for (const k of o) if (k.startsWith('set:company:')) next.delete(k)
        next.add(key)
      }
      return next
    })
  const today = dayKey(riyadhNow())
  const onLeave = leave.some((l) => l.personId === profile.id && l.startsOn <= today && l.endsOn >= today)

  const handleSignOut = async () => {
    onNavigate?.() // close the mobile drawer before we leave the shell
    await signOut()
    navigate(PUBLIC.login, { replace: true })
    toast(t('shared.layout.signedOut'), 'success')
  }

  /* Header and your card stay put; the groups between them scroll on a short window. */
  return (
    <div className="flex h-full flex-col overflow-hidden bg-brand-700 px-3.5 pt-5.5 pb-3.5 text-white">
      {/* Whose panel this is: the logo, then the role's portal name from Settings → Lists. The PNG
          is teal on transparent; brightness-0 + invert turns it white for the panel. */}
      <div className={cx('flex shrink-0 flex-col items-center gap-2.5 border-b pb-4', RULE)}>
        <img src={LOGO} alt={brand.app} className="h-15 w-auto brightness-0 invert" />
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/14 px-3 text-[11px] tracking-[0.14em] whitespace-nowrap uppercase">
          <Icon name="shield" strokeWidth={2} className="size-3" />
          {meta('role', role, 'portal') || label('role', role)}
        </span>
      </div>

      {primary && (
        <NavLink
          id="sidebar-primary"
          to={primary.path}
          onClick={onNavigate}
          className="ui-sidebar__primary my-3.5 flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-white text-sm text-brand-700 shadow-[0_8px_18px_-12px_rgb(0_0_0/0.4)] transition hover:bg-brand-50 focus-visible:outline-white"
        >
          <Icon name={primary.icon} strokeWidth={1.8} className="size-4.5" />
          {t(`shared.layout.nav.${primary.key}`)}
        </NavLink>
      )}

      {/* The rule under Add a member; without that button the logo's rule is the only one. */}
      <nav className={cx('scrollbar-slim flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto', primary ? cx('border-t pt-3', RULE) : 'pt-4')}>
        {SECTIONS.map((section, i) => (
          <div key={section.key} className="flex flex-col gap-2.5">
            {/* The first group goes without a heading, as in the design. */}
            {i > 0 && <p className="px-3 text-[11px] tracking-[0.16em] uppercase opacity-75">{t(`shared.layout.sections.${section.key}`)}</p>}
            <div className="flex flex-col gap-0.5 rounded-2xl bg-black/8 p-1.5">
              {tree
                .filter((node) => node.section === section.key)
                .map((node) => (
                  <Node key={node.key} node={node} depth={0} open={open} toggle={toggle} here={here} counts={counts} onSelect={onNavigate} />
                ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Who is signed in: opens their own settings. The language and Sign out sit beside it. */}
      <div className={cx('mt-3 flex shrink-0 flex-col gap-2.5 border-t pt-3', RULE)}>
        <div className="flex items-center gap-2 rounded-2xl bg-white/12 p-1.75">
          <NavLink id="sidebar-profile" to={ROUTES.settings} onClick={onNavigate} className="ui-sidebar__profile flex min-w-0 flex-1 items-center gap-2.5 rounded-[14px] focus-visible:outline-white">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-sm text-brand-700">{initials(profile.name)}</span>
            )}
            <span className="flex min-w-0 flex-col">
              {/* An English name stays left to right in Arabic too, so it's cut at its end, not its start. */}
              <span dir="auto" className="truncate text-sm rtl:text-right">{profile.name}</span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="truncate opacity-80">{label('role', profile.role)}</span>
                {onLeave && <span className="rounded-full bg-warn px-1.5 py-px text-[11px] text-ink">{t('shared.layout.onLeave')}</span>}
              </span>
            </span>
          </NavLink>
          <LanguageSwitch short />
          <button id="sidebar-sign-out"
            type="button"
            onClick={handleSignOut}
            aria-label={t('shared.layout.signOut')}
            title={t('shared.layout.signOut')}
            className="ui-sidebar__sign-out grid size-9 shrink-0 place-items-center rounded-[11px] bg-white/14 transition hover:bg-white/24 focus-visible:outline-white"
          >
            <Icon name="logout" strokeWidth={1.8} className="size-4.25" />
          </button>
        </div>
      </div>
    </div>
  )
}
