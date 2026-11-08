import { OnboardingOverview } from '../views/onboarding/OnboardingOverview.jsx'
import { OnboardingTab } from '../views/onboarding/OnboardingTab.jsx'

/** The Onboarding portal: their dashboard and the member page's Onboarding tab. */
export default {
  role: 'onboarding',
  overview: OnboardingOverview,
  memberTabs: { onboarding: OnboardingTab },
}
