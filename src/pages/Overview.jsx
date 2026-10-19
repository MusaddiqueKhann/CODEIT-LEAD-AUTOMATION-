import { PageHeader } from '../components/layout/index.js'
import {
  ActionCenter,
  FreeSessionsBanner,
  Hero,
  PastTimeline,
  StatTiles,
  UpcomingTimeline,
} from '../components/overview/index.js'
import { TODAY, user } from '../data/mockData.js'
import { formatLong } from '../lib/format.js'

export default function Overview() {
  /* Reads the real clock, not the fixtures' TODAY: it greets the person for the
     time they actually opened the app, and unlike the countdowns below it is
     never measured against a mocked session time, so it has nothing to drift
     against. */
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <PageHeader title={`${greeting}, ${user.firstName}`} subtitle={formatLong(TODAY)} />

      <div className="flex flex-col gap-6">
        <Hero />
        <FreeSessionsBanner />
        <StatTiles />
        <ActionCenter />
        <UpcomingTimeline />
        <PastTimeline />
      </div>
    </>
  )
}
