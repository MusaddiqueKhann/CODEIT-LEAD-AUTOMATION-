import { useState } from 'react'
import { Card, Switch } from '../ui/index.js'

/**
 * The notification switches.
 *
 * Local to the page: the prototype has no server to persist these to, and
 * putting them in a context would imply the rest of the app reads them.
 */
export function Preferences() {
  const [prefs, setPrefs] = useState({ email: true, reminders: true, marketing: false })
  const set = (key) => (value) => setPrefs((p) => ({ ...p, [key]: value }))

  return (
    <Card
      padding="lg"
      surface="border-transparent bg-panel"
      className="divide-y divide-line-soft shadow-sm"
    >
      <Switch
        checked={prefs.email}
        onChange={set('email')}
        label="Booking emails"
        description="Confirmations, moves and cancellations."
      />
      <Switch
        checked={prefs.reminders}
        onChange={set('reminders')}
        label="Session reminders"
        description="The day before, and 10 minutes ahead."
      />
      <Switch
        checked={prefs.marketing}
        onChange={set('marketing')}
        label="News from CODE"
        description="New courses and occasional offers."
      />
    </Card>
  )
}
