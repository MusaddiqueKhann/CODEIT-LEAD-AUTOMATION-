import { FeedbackCard } from './FeedbackCard.jsx'
import { RecordingCard } from './RecordingCard.jsx'
import { SessionCard } from './SessionCard.jsx'
import { SetupCard } from './SetupCard.jsx'

/** Onboarding's step: the setup checklist, the session, the recording and the feedback; read-only once Closed. */
export function OnboardingTab(props) {
  return (
    <>
      <SetupCard {...props} />
      <SessionCard {...props} />
      <RecordingCard {...props} />
      <FeedbackCard {...props} />
    </>
  )
}
