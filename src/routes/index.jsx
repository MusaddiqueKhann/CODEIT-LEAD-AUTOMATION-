import { Navigate, Outlet, useRoutes } from 'react-router-dom'
import { AppShell } from '@/components'
import { ConfigProvider } from '../controllers/shared/ConfigContext.jsx'
import { MemberDetailsPage } from '../views/shared/member/MemberDetailsPage.jsx'
import { OverviewPage } from '../views/shared/overview/OverviewPage.jsx'
import account from './account.js'
import admin from './admin.js'
import customer from './customer.js'
import { RedirectIfAuthed, RequireAuth, RequireConfig, RequireRole } from './guards.jsx'
import integration from './integration.js'
import onboarding from './onboarding.js'
import { NAV, ROUTES } from './paths.js'
import sales from './sales.js'
import shared from './shared.js'
import signin from './signin.js'

/* The five role portals. Each brings its dashboard, its pages and routes, and its member-page tab. */
const PORTALS = [admin, sales, account, integration, onboarding]
const dashboards = Object.fromEntries(PORTALS.map((p) => [p.role, p.overview]))
const memberTabs = Object.assign({}, ...PORTALS.map((p) => p.memberTabs))
const pages = Object.assign({}, shared.pages, ...PORTALS.map((p) => p.pages))

/** A page that sends someone already signed in straight on, or just the page. */
const open = ({ path, Page, signedOut }) => ({
  path,
  element: signedOut ? (
    <RedirectIfAuthed>
      <Page />
    </RedirectIfAuthed>
  ) : (
    <Page />
  ),
})

/**
 * Every address in the app. The signed-out pages (sign-in, the customer page) own the whole screen;
 * everything else sits behind the gate, then the config, then the shell. A page outside a role's
 * portal goes to Overview (RequireRole). Paths and who may open each sidebar page come from NAV.
 */
export function AppRoutes() {
  return useRoutes([
    ...signin.routes.map(open),
    ...customer.routes.map(open),
    {
      element: (
        <RequireAuth>
          <ConfigProvider>
            <RequireConfig>
              <AppShell>
                <Outlet />
              </AppShell>
            </RequireConfig>
          </ConfigProvider>
        </RequireAuth>
      ),
      children: [
        ...NAV.map(({ key, path, roles }) => {
          const Page = pages[key]
          return {
            path,
            element: <RequireRole roles={roles}>{key === 'overview' ? <OverviewPage dashboards={dashboards} /> : <Page />}</RequireRole>,
          }
        }),
        // Every role opens member details; the server only returns the members that are theirs.
        { path: `${ROUTES.members}/:code`, element: <MemberDetailsPage tabs={memberTabs} /> },
        ...PORTALS.flatMap((p) =>
          (p.routes ?? []).map(({ path, Page }) => ({
            path,
            element: (
              <RequireRole roles={[p.role]}>
                <Page />
              </RequireRole>
            ),
          })),
        ),
        // A typed URL lands on Overview rather than an empty shell.
        { path: '*', element: <Navigate to={ROUTES.overview} replace /> },
      ],
    },
  ])
}
