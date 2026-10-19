import { NavLink, useNavigate } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { Avatar } from '../ui/Avatar.jsx'
import { cx } from '../../lib/cx.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useBookings } from '../../context/BookingContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { user } from '../../data/mockData.js'
import { PRIMARY_NAV, ROUTES } from '../../lib/nav.js'

/**
 * A rail destination.
 *
 * NavLink rather than a button, so these are real anchors — middle-click and
 * "open in new tab" work, and the active state comes from the router instead of
 * being compared against a page string by hand.
 */
function NavItem({ item, badge, onSelect }) {
  return (
    <NavLink
      to={item.path}
      // `end` only on "/" — without it the root route matches every path and
      // Overview would render as active on every page.
      end={item.path === ROUTES.overview}
      onClick={onSelect}
      className={({ isActive }) =>
        cx(
          'group relative flex w-full items-center gap-3.5 rounded-xl py-2.5 pr-3 pl-4 text-[15px] transition',
          // The rail is a brand-700 panel, so states are carried by white
          // washes over the fill rather than by ramp steps — a step fill here
          // would read as a second panel, not a state. Labels take pure white:
          // the index.css note on 700 (soft white computes to 4.499:1) applies
          // to every small run of text in this column.
          //
          // The active pill is the one deliberate trade against that note —
          // white/15 lightens the fill under the label to ~3.6:1, which is
          // what the mock shows. The marker, the weight change and the icon
          // going full white all carry the state redundantly, so the pill is
          // never the only signal.
          'focus-visible:outline-white',
          isActive
            ? 'bg-white/15 font-semibold text-white'
            : 'font-medium text-white hover:bg-white/10',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active marker, seated on the button's own left edge rather than out
              at the panel edge — sitting 14px clear of the pill it read as a
              stray tick belonging to nothing. inset-y-3 holds it inside the 12px
              corner radius, so it lands on the fill instead of poking past the
              curve, and leaves it roughly the height of the icon beside it.
              brand-200, the mint the badge also wears — the light accents on
              this panel all come from the same step. */}
          <span
            className={cx(
              'absolute inset-y-3 left-0 w-[3px] rounded-full bg-brand-200 transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          <Icon
            name={item.icon}
            strokeWidth={1.8}
            className={cx(
              'size-5 shrink-0 transition',
              // brand-100 rest, white on hover/active — one visible notch below
              // the label, mirroring the muted→ink pairing the light rail used.
              isActive ? 'text-white' : 'text-brand-100 group-hover:text-white',
            )}
          />
          <span className="flex-1 truncate text-left">{item.label}</span>
          {badge > 0 && (
            <span
              // Mint disc, deep ink count — steps 50–600 carry ink, and
              // brand-200 holds 3.8:1 against the 700 panel, so the disc
              // itself clears the 3:1 a UI shape needs.
              className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-200 px-1.5 text-[12px] font-semibold text-on-brand-dark"
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function NavSection({ label, children }) {
  return (
    <div>
      {/* MENU names the group below it, so it takes the panel's muted tier —
          brand-100, the same step the metadata lines and resting icons use. */}
      <p className="eyebrow mb-2 px-4 text-brand-100">{label}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

export function Sidebar({ onNavigate }) {
  const { awaitingFeedback } = useBookings()
  const { toast } = useToast()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    onNavigate?.() // close the mobile drawer before we leave the shell
    signOut()
    navigate('/login', { replace: true })
    toast('You have been signed out.', 'success')
  }

  /* The rail is sized to fit a 768px-tall viewport without scrolling — roughly
     650px of content against ~744px of room. overflow-y-auto is kept as a
     fallback for very short windows: without it the tail of the nav and Sign
     out would be unreachable rather than merely off-screen. It should not
     engage at any normal window size.

     bg-brand-700 — the "Deep #347c81" panel from the design. Everything inside
     follows from that one choice: text is pure white (the 700 rule in
     index.css), secondary text is brand-100, dividers and state fills are
     white washes, and the focus ring flips to white because the default
     brand-700 ring would vanish into its own panel. */
  return (
    <div className="scrollbar-slim flex h-full flex-col overflow-y-auto bg-brand-700 px-3.5 py-5">
      {/* Centred to match the identity block below it — the two are the rail's
          header, and the nav's left-aligned icon column starts under them. */}
      <div className="mb-8 flex items-center justify-center px-2">
        {/* One asset, two colours: the PNG is the seed aqua on transparent, and
            brightness-0 + invert flattens every opaque pixel to pure white for
            the dark panel — the mobile header keeps the aqua original on its
            white bar. max-w-full caps growth by width, not just height: the
            rail's usable interior is ~228px (w-68 less px-3.5 and px-2), so a
            wordmark this wide is closer to that ceiling than the height
            suggests. */}
        <img
          src="/CompanyLogo/Codeit-flat.png"
          alt="CODEIT"
          className="h-16 w-auto max-w-full object-contain brightness-0 invert"
        />
      </div>

      {/* Identity block. The avatar is a white wash so it lifts off the panel
          without introducing a second colour. The whole block is a shortcut to
          Profile. */}
      <button
        type="button"
        onClick={() => {
          navigate(ROUTES.profile)
          onNavigate?.()
        }}
        className="group flex flex-col items-center border-b border-white/20 px-2 pt-1 pb-5 text-center focus-visible:outline-white"
      >
        <Avatar initials={user.initials} size="lg" tone="deep" />
        {/* No hover fill on the block — at this size the wash read as a panel
            sitting on the rail rather than as a hover state. The name carrying
            the colour instead keeps the affordance without the box. */}
        <span className="mt-3 block max-w-full truncate text-[17px] font-semibold tracking-tight text-white transition group-hover:text-brand-200">
          {user.name}
        </span>
        <span className="mt-1.5 block max-w-full truncate text-[13px] text-brand-100">
          {user.email}
        </span>
        <span className="mt-0.5 block text-[13px] text-brand-100">{user.phone}</span>
      </button>

      <nav className="mt-5">
        <NavSection label="Menu">
          {PRIMARY_NAV.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              badge={item.key === 'feedback' ? awaitingFeedback.length : 0}
              onSelect={onNavigate}
            />
          ))}
        </NavSection>
      </nav>

      {/* Sign out sits apart from the nav, so it is centred rather than aligned
          to the icon column — it is not another destination in the list. The
          wash is carried at rest instead of only on hover: as the last thing in
          the rail it needs a shape of its own to land on. Neutral white rather
          than danger — on the dark panel the mock treats it as a quiet footer
          control, and a red fill would be the loudest thing in the column. */}
      <div className="mt-auto border-t border-white/20 pt-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/12 py-3 text-[15px] font-semibold text-white transition hover:bg-white/20 focus-visible:outline-white"
        >
          <Icon name="logout" strokeWidth={1.8} className="size-5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
