import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/index.js'
import { Button, ConfirmDialog, EmptyState, Tabs } from '../components/ui/index.js'
import { PastRow, UpcomingRow } from '../components/bookings/index.js'
import { useBookings } from '../context/BookingContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { TODAY } from '../data/mockData.js'
import { formatMedium } from '../lib/format.js'
import { ROUTES } from '../lib/nav.js'

export default function MyBookings() {
  const { upcomingBookings, pastBookings, cancelBooking, startReschedule, submitFeedback } =
    useBookings()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [tab, setTab] = useState('upcoming')
  /* The booking queued for cancellation, not just its id — the dialog's copy
     needs the date and time, and holding the record keeps them available. */
  const [pendingCancel, setPendingCancel] = useState(null)

  /* Hours between now and the session — the refund rule's only input. */
  const refundable = pendingCancel ? (pendingCancel.date - TODAY) / 36e5 >= 24 : false

  const tabs = [
    { key: 'upcoming', label: 'Upcoming', count: upcomingBookings.length },
    { key: 'past', label: 'Past', count: pastBookings.length },
  ]

  const rows = tab === 'upcoming' ? upcomingBookings : pastBookings

  return (
    <>
      <PageHeader title="My bookings" subtitle="Every session you've booked, moved or attended." />

      <Tabs items={tabs} value={tab} onChange={setTab} className="mb-5" />

      {rows.length === 0 ? (
        <EmptyState
          icon={tab === 'upcoming' ? 'calendarPlus' : 'clock'}
          title={tab === 'upcoming' ? 'Nothing booked' : 'No past sessions'}
          description={
            tab === 'upcoming'
              ? 'Book a slot and it will appear here with a join link.'
              : 'Sessions move here once they’ve happened or been cancelled.'
          }
          action={
            tab === 'upcoming' ? (
              <Button icon="plus" onClick={() => navigate(ROUTES.book)}>
                Book a session
              </Button>
            ) : null
          }
        />
      ) : (
        /* Free-standing cards with a gutter, not a divided List — each row in
           the design is its own card so the hero can sit dark among them. */
        <ul className="flex flex-col gap-3.5">
          {tab === 'upcoming'
            ? upcomingBookings.map((booking, index) => (
                <UpcomingRow
                  key={booking.id}
                  booking={booking}
                  hero={index === 0}
                  onJoin={() => toast('Opening your session…')}
                  onMove={() => startReschedule(booking.id)}
                  onCancel={() => setPendingCancel(booking)}
                />
              ))
            : pastBookings.map((booking) => (
                <PastRow key={booking.id} booking={booking} onRate={submitFeedback} />
              ))}
        </ul>
      )}

      {/* The refund rule is stated in the dialog rather than discovered from the
          toast afterwards — it is the whole basis for deciding to confirm. */}
      <ConfirmDialog
        open={Boolean(pendingCancel)}
        onClose={() => setPendingCancel(null)}
        onConfirm={() => cancelBooking(pendingCancel.id)}
        title="Cancel this session?"
        description={
          pendingCancel
            ? refundable
              ? `${formatMedium(pendingCancel.date)} at ${pendingCancel.time}. It's more than 24 hours away, so the session goes back to your balance.`
              : `${formatMedium(pendingCancel.date)} at ${pendingCancel.time}. It's inside 24 hours, so the session will not be refunded.`
            : ''
        }
        confirmLabel="Cancel session"
        cancelLabel="Keep it"
      />
    </>
  )
}
