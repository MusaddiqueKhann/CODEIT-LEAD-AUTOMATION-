import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/index.js'
import { Button, EmptyState, SectionHeader } from '../components/ui/index.js'
import { AwaitingCard, CompletedFeedbackRow } from '../components/feedback/index.js'
import { useBookings } from '../context/BookingContext.jsx'
import { ROUTES } from '../lib/nav.js'

export default function Feedback() {
  const { awaitingFeedback, pastBookings, submitFeedback } = useBookings()
  const navigate = useNavigate()

  /* Cancelled sessions aren't feedback, so we start from Completed rather than
     all of pastBookings. `reviewed` is the subset that's actually been rated —
     the "Completed feedback" list — while the still-unrated ones sit up top in
     the awaiting prompt. `completed` stays as the gate for the empty state:
     nothing completed at all means there's genuinely nothing to rate yet. */
  const completed = pastBookings.filter((b) => b.status === 'Completed')
  const reviewed = completed.filter((b) => b.rated)

  return (
    <>
      <PageHeader
        title="Feedback"
        subtitle="Rate a finished session so CODE can tune the next one."
      />

      {completed.length === 0 ? (
        <EmptyState
          icon="chat"
          title="Nothing to rate yet"
          description="Once you've attended a session it'll show up here for feedback."
          action={
            <Button icon="plus" onClick={() => navigate(ROUTES.book)}>
              Book a session
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-12">
          {awaitingFeedback.length > 0 && (
            <section className="mx-auto w-full max-w-2xl">
              <p className="eyebrow mb-4 mt-8 text-center text-muted">Awaiting your feedback</p>
              <div className="flex flex-col gap-6">
                {awaitingFeedback.map((booking) => (
                  <AwaitingCard key={booking.id} booking={booking} onSubmit={submitFeedback} />
                ))}
              </div>
            </section>
          )}

          {reviewed.length > 0 && (
            <section>
              <SectionHeader title="Completed feedback" className="mb-2" />
              <ul>
                {reviewed.map((booking) => (
                  <CompletedFeedbackRow key={booking.id} booking={booking} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  )
}
