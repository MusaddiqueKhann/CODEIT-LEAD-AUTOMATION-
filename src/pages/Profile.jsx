import { PageHeader } from '../components/layout/index.js'
import { SectionHeader } from '../components/ui/index.js'
import {
  ChangePassword,
  DetailsForm,
  IdentityHeader,
  Preferences,
} from '../components/profile/index.js'

export default function Profile() {
  return (
    <>
      <PageHeader title="Profile" subtitle="Your details, and how CODE reaches you." />

      {/* Single column, sections stacked — no sidebar. Every block runs the
          full canvas width: the identity banner, the details form and the
          notification switches. */}
      <div className="flex flex-col gap-8">
        <IdentityHeader />

        <section>
          <SectionHeader title="Personal details" className="mb-3" />
          <DetailsForm />
        </section>

        <section>
          <SectionHeader title="Change password" className="mb-3" />
          <ChangePassword />
        </section>

        <section>
          <SectionHeader title="Notifications" className="mb-3" />
          <Preferences />
        </section>
      </div>
    </>
  )
}
