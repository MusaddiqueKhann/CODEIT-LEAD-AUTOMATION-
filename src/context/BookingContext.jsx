import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from './ToastContext.jsx'
import { useNotifications } from './NotificationContext.jsx'
import { allowance as initialAllowance, initialBookings, TODAY } from '../data/mockData.js'
import { formatShort } from '../lib/format.js'
import { hasClash } from '../lib/schedule.js'
import { ROUTES } from '../lib/nav.js'

const BookingContext = createContext(null)

export function useBookings() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBookings must be used inside <BookingProvider>')
  return ctx
}

let seq = 0

/**
 * Sessions, allowance and payment state — the app's domain slice.
 *
 * Consumes toast and notify from the providers above it, so an action can
 * report itself without every page wiring up the plumbing.
 */
export function BookingProvider({ children }) {
  const { toast } = useToast()
  const { notify } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()

  const [bookings, setBookings] = useState(initialBookings)
  const [allowance, setAllowance] = useState(initialAllowance)
  const [paymentStatus, setPaymentStatus] = useState('pending') // none | pending | verified
  /** Id of the booking being moved, or null when booking fresh. */
  const [reschedulingId, setReschedulingId] = useState(null)

  /**
   * Leaving the booking page abandons an in-progress move.
   *
   * Derived from the location rather than done in a BookSession unmount
   * effect, which keeps it correct under StrictMode — an unmount cleanup would
   * clear the target during the double-invoked mount, cancelling the move the
   * moment it started.
   */
  useEffect(() => {
    if (location.pathname !== ROUTES.book) setReschedulingId(null)
  }, [location.pathname])

  /** Free sessions are spent before the paid balance. */
  const bookSession = useCallback(
    ({ date, time, title }) => {
      const usingFree = allowance.freeLeft > 0
      if (!usingFree && allowance.paidBalance < 1) {
        toast('No sessions available — please pay to unlock one.', 'danger')
        return false
      }

      if (hasClash(bookings, { date, time })) {
        toast('You already have a booking in that slot.', 'danger')
        return false
      }

      setAllowance((current) => ({
        ...current,
        freeLeft: usingFree ? current.freeLeft - 1 : current.freeLeft,
        paidBalance: usingFree ? current.paidBalance : current.paidBalance - 1,
      }))

      setBookings((current) => [
        {
          id: `new-${++seq}`,
          title: title || 'Training session',
          date,
          time,
          status: usingFree ? 'Free' : 'Paid',
          upcoming: true,
        },
        ...current,
      ])

      notify({
        kind: 'booking',
        title: 'Booking confirmed',
        body: `${title || 'Training session'} · ${formatShort(date)}, ${time}.`,
      })

      toast(`Booked — ${usingFree ? '1 free session used' : '1 paid session used'}.`)
      return true
    },
    [allowance, bookings, notify, toast],
  )

  /**
   * Moving a booking keeps the session that was already spent on it, so the
   * allowance is deliberately left alone here.
   */
  const rescheduleBooking = useCallback(
    ({ date, time }) => {
      const booking = bookings.find((b) => b.id === reschedulingId)
      if (!booking) return false

      if (hasClash(bookings, { date, time, exceptId: booking.id })) {
        toast('You already have a booking in that slot.', 'danger')
        return false
      }

      setBookings((current) => current.map((b) => (b.id === booking.id ? { ...b, date, time } : b)))

      notify({
        kind: 'booking',
        title: 'Booking moved',
        body: `${booking.title} is now ${formatShort(date)}, ${time}.`,
      })

      toast(`Moved to ${formatShort(date)}, ${time}.`)
      setReschedulingId(null)
      return true
    },
    [bookings, notify, reschedulingId, toast],
  )

  const startReschedule = useCallback(
    (id) => {
      setReschedulingId(id)
      navigate(ROUTES.book)
    },
    [navigate],
  )

  const cancelReschedule = useCallback(() => setReschedulingId(null), [])

  /** Cancelling more than 24h ahead returns the session to the balance. */
  const cancelBooking = useCallback(
    (id) => {
      const booking = bookings.find((b) => b.id === id)
      if (!booking) return

      const hoursAhead = (booking.date - TODAY) / 36e5
      const refunded = hoursAhead >= 24

      setBookings((current) =>
        current.map((b) => (b.id === id ? { ...b, status: 'Cancelled', upcoming: false } : b)),
      )

      if (refunded) {
        setAllowance((current) => ({
          ...current,
          freeLeft: booking.status === 'Free' ? current.freeLeft + 1 : current.freeLeft,
          paidBalance: booking.status === 'Paid' ? current.paidBalance + 1 : current.paidBalance,
        }))
      }

      notify({
        kind: 'cancelled',
        title: 'Booking cancelled',
        body: `${booking.title} · ${formatShort(booking.date)}. ${
          refunded
            ? 'The session was returned to your balance.'
            : 'Cancelled inside 24 hours — not refunded.'
        }`,
      })

      toast(
        refunded ? 'Booking cancelled — session returned to your balance.' : 'Booking cancelled.',
        refunded ? 'success' : 'warn',
      )
    },
    [bookings, notify, toast],
  )

  const submitFeedback = useCallback(
    (id, rating, comment) => {
      setBookings((current) =>
        current.map((b) => (b.id === id ? { ...b, rated: true, rating, comment } : b)),
      )
      toast('Thanks — your feedback was sent to CODE.')
    },
    [toast],
  )

  const flagPayment = useCallback(() => {
    setPaymentStatus('pending')
    notify({
      kind: 'payment',
      title: 'Payment awaiting verification',
      body: 'Your transfer was flagged for review. An admin unlocks the session once verified.',
    })
    toast('Admin notified. Your session unlocks once the transfer is verified.')
  }, [notify, toast])

  const upcomingBookings = useMemo(
    () => bookings.filter((b) => b.upcoming).sort((a, b) => a.date - b.date),
    [bookings],
  )

  const pastBookings = useMemo(
    () => bookings.filter((b) => !b.upcoming).sort((a, b) => b.date - a.date),
    [bookings],
  )

  const awaitingFeedback = useMemo(
    () => bookings.filter((b) => b.status === 'Completed' && !b.rated),
    [bookings],
  )

  const reschedulingBooking = useMemo(
    () => bookings.find((b) => b.id === reschedulingId) ?? null,
    [bookings, reschedulingId],
  )

  const totalAvailable = allowance.freeLeft + allowance.paidBalance
  const nextSession = upcomingBookings[0] ?? null

  const value = useMemo(
    () => ({
      bookings,
      upcomingBookings,
      pastBookings,
      nextSession,
      awaitingFeedback,
      allowance,
      totalAvailable,
      paymentStatus,
      reschedulingBooking,
      bookSession,
      rescheduleBooking,
      startReschedule,
      cancelReschedule,
      cancelBooking,
      submitFeedback,
      flagPayment,
    }),
    [
      bookings,
      upcomingBookings,
      pastBookings,
      nextSession,
      awaitingFeedback,
      allowance,
      totalAvailable,
      paymentStatus,
      reschedulingBooking,
      bookSession,
      rescheduleBooking,
      startReschedule,
      cancelReschedule,
      cancelBooking,
      submitFeedback,
      flagPayment,
    ],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}
