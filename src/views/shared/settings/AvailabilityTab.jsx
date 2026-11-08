import { useState } from 'react'
import { Button, HoursEditor, Icon, LeaveDialog, Panel } from '@/components'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useToast } from '../../../controllers/shared/ToastContext.jsx'
import { addLeave, removeLeave, setHours, useLeave } from '../../../controllers/shared/useLeave.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { weekdayNames, formatShort, fromDay } from '../../../models/rules/format.js'
import { useUnsaved } from '../../../controllers/shared/unsaved.js'

/** "Sun–Thu, 09:00–17:00 · Thu 09:00–14:00": the office hours in a line. */
function officeLine(hours, t) {
  const on = hours.flatMap((h, i) => (h.on ? [i] : []))
  if (!on.length) return t('shared.settings.availability.noOffice')
  const days = weekdayNames()
  const [usual] = Object.entries(Object.groupBy(on, (i) => `${hours[i].from}–${hours[i].to}`)).sort((a, b) => b[1].length - a[1].length)
  const odd = on.filter((i) => `${hours[i].from}–${hours[i].to}` !== usual[0]).map((i) => `${days[i]} ${hours[i].from}–${hours[i].to}`)
  return `${t('shared.settings.availability.officeLine', { from: days[on[0]], to: days[on.at(-1)], hours: usual[0] })}${odd.length ? ` · ${odd.join(' · ')}` : ''}`
}

/** Your weekly hours (saved from the bar) and your leave (added and removed at once; the Admin is told). */
export function AvailabilityTab({ after }) {
  const { profile, reloadProfile } = useAuth()
  const { settings } = useConfig()
  const { toast } = useToast()
  const { t } = useLang()
  const leave = useLeave(profile.id)
  const { run } = useAction(() => {
    leave.reload()
    reloadProfile()
    after()
  })
  const [hours, setHoursDraft] = useState(profile.hours ?? null)
  const [adding, setAdding] = useState(false)

  useUnsaved('hours', JSON.stringify(hours) !== JSON.stringify(profile.hours ?? null), () => run(() => setHours(profile.id, hours)))

  const add = async (from, to) => {
    let r
    const done = await run(async () => (r = await addLeave(profile.id, from, to)), t('shared.settings.availability.leaveAdded'))
    if (done && r.sessions) toast(t('shared.settings.availability.leaveClash', { n: r.sessions }), 'warn')
    return done
  }

  return (
    <>
      <Panel id="availability-tab-hours-title"
        className="[animation-delay:.08s]"
        title={t('shared.settings.availability.hoursTitle')}
        sub={t('shared.settings.availability.hoursSub')}
        note={t('shared.settings.availability.officeNote', { hours: officeLine(settings.officeHours, t) })}
      >
        <HoursEditor value={hours} office={settings.officeHours} onChange={setHoursDraft} />
      </Panel>

      <Panel id="availability-tab-leave-title"
        className="[animation-delay:.08s]"
        title={t('shared.settings.availability.leaveTitle')}
        sub={t('shared.settings.availability.leaveSub')}
        aside={<Button id="availability-tab-add-leave" onClick={() => setAdding(true)}>{t('shared.settings.availability.addLeave')}</Button>}
      >
        {!leave.data ? (
          <p className="text-sm text-muted">{t('shared.common.loading')}</p>
        ) : leave.data.length === 0 ? (
          <div className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-[20px] border-[1.5px] border-dashed border-brand-dash text-sm text-muted">
            <Icon name="calendar" className="size-5" strokeWidth={1.8} />
            {t('shared.settings.availability.noLeave')}
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {leave.data.map((l) => (
              <li key={l.id} className="flex h-12 items-center gap-3 rounded-2xl bg-surface-2 ps-4 pe-2">
                <span className="flex-1 text-sm text-ink">
                  {formatShort(fromDay(l.startsOn))}
                  {l.endsOn !== l.startsOn && ` – ${formatShort(fromDay(l.endsOn))}`}
                </span>
                <Button id={`availability-tab-remove-${l.id}`} variant="danger" size="sm" onClick={() => run(() => removeLeave(l.id), t('shared.settings.availability.leaveRemoved'))}>
                  {t('shared.common.remove')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <LeaveDialog open={adding} onClose={() => setAdding(false)} name={profile.name} onSave={add} />
    </>
  )
}
