import { AuthProvider } from '../context/AuthContext.jsx'
import { BookingProvider } from '../context/BookingContext.jsx'
import { NotificationProvider } from '../context/NotificationContext.jsx'
import { ToastProvider } from '../context/ToastContext.jsx'

/**
 * Composes the provider stack in dependency order, outermost first:
 *
 *   Auth           — depends on nothing; the router gate and sidebar read it
 *   Toast          — depends on nothing
 *   Notification   — depends on nothing
 *   Booking        — calls toast() and notify(), so it must sit inside both
 *
 * Keeping the order in one file means the nesting is a stated contract rather
 * than something a future provider silently breaks by being added in the wrong
 * place. Must be rendered inside the router: BookingProvider reads the location
 * to abandon an in-progress reschedule.
 */
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <BookingProvider>{children}</BookingProvider>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
