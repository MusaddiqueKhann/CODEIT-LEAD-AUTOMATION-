import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '../lib/nav.js'
import Overview from '../pages/Overview.jsx'
import BookSession from '../pages/BookSession.jsx'
import MyBookings from '../pages/MyBookings.jsx'
import Payments from '../pages/Payments.jsx'
import Feedback from '../pages/Feedback.jsx'
import Profile from '../pages/Profile.jsx'
import Palette from '../pages/Palette.jsx'

/**
 * The route tree.
 *
 * Paths come from lib/nav.js rather than being typed here, so the rail, global
 * search and the router cannot disagree about where a page lives — the class of
 * bug where a renamed path leaves a dead sidebar link.
 *
 * `palette` is deliberately absent from PRIMARY_NAV: it is the internal design
 * system reference, reachable by URL and by search but not advertised.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.overview} element={<Overview />} />
      <Route path={ROUTES.book} element={<BookSession />} />
      <Route path={ROUTES.bookings} element={<MyBookings />} />
      <Route path={ROUTES.payments} element={<Payments />} />
      <Route path={ROUTES.feedback} element={<Feedback />} />
      <Route path={ROUTES.profile} element={<Profile />} />
      <Route path={ROUTES.palette} element={<Palette />} />
      {/* A typed URL lands on Overview rather than an empty shell. */}
      <Route path="*" element={<Navigate to={ROUTES.overview} replace />} />
    </Routes>
  )
}
