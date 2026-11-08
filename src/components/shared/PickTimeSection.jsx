import { useState } from 'react'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { useBookableDays, useOpenTimes } from '../../controllers/shared/useSlots.js'
import { dayKey, formatShort, riyadhNow, startOfDay } from '../../models/rules/format.js'
import { docsFor, dueOn } from '../../models/rules/members.js'
import { addDays, addWorkingDays } from '../../models/rules/time.js'
import { TONES } from '../tones.js'
import { Button, cx } from '../ui/index.js'
import { Section } from './Section.jsx'
import { SlotPicker } from './SlotPicker.jsx'

/**
 * Section 4: the session time. "Files ready by" is the same date as Documents: picking one sets it
 * on every file still to send. The server then offers days from the later of the Admin's buffer and
 * the files' day plus one working day, and the times with someone free.
 * Add a member and the member's Sales tab. On a saved member, `memberId` lets its own time count as
 * free; `open` false shows only `top` (the booked time); `aside` sits by the title and `bottom`
 * under the picker. Without `set` the files' date is read-only.
 */
export function PickTimeSection({ draft, set, value, onChange, memberId = null, open = true, aside, top, bottom }) {
  const { t } = useLang()
  return (
    <Section id="pick-time" n={4} title={t('shared.pickTime.title')} sub={t('shared.pickTime.sub')} aside={aside}>
      {top}
      {open && <Picker draft={draft} set={set} value={value} onChange={onChange} memberId={memberId} />}
      {open && bottom}
    </Section>
  )
}

function Picker({ draft, set, value, onChange, memberId }) {
  const { settings, holidays, active } = useConfig()
  const { t } = useLang()
  const today = startOfDay(riyadhNow())
  const pending = docsFor(active('document'), draft.plan, draft.integrations).filter((k) => !draft.files[k])
  const dues = pending.map((k) => draft.due[k])
  const latest = dues.length && dues.every((d) => d != null) ? Math.max(...dues) : null
  const readyOn = latest != null ? addDays(today, latest) : null
  const ready = readyOn && dayKey(readyOn)

  const { data: days } = useBookableDays(ready, memberId)
  const [shown, setShown] = useState({ ready, day: 0 })
  const day = shown.ready === ready ? shown.day : 0
  const date = days?.[day]
  const { data: slots } = useOpenTimes(date ? dayKey(date) : null, memberId)

  const choices = active('due_choice').map((c) => c.meta.days)
  const pills = latest != null && !choices.includes(latest) ? [latest, ...choices] : choices
  const pick = (days) => {
    set({ due: { ...draft.due, ...Object.fromEntries(pending.map((k) => [k, days])) } })
    onChange(null)
  }
  const flow = readyOn
    ? [
        { k: t('shared.pickTime.filesIn'), v: formatShort(readyOn) },
        { k: t('shared.pickTime.ready'), v: formatShort(addWorkingDays(readyOn, settings.filesReadyDays, settings.officeHours, new Set(holidays.map((h) => h.day)))) },
      ]
    : [
        { k: t('shared.pickTime.today'), v: formatShort(today) },
        { k: t('shared.pickTime.buffer'), v: t('shared.pickTime.bufferDays', { n: settings.bufferDays }) },
      ]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-medium text-ink">{t('shared.pickTime.filesReady')}</span>
          <span className="text-[13px] text-muted">{t('shared.pickTime.firstSession', { n: settings.filesReadyDays })}</span>
        </div>
        {!draft.plan ? (
          <span className="text-sm text-muted">{t('shared.pickTime.pickType')}</span>
        ) : pending.length === 0 ? (
          <span className={cx('inline-flex h-9.5 items-center rounded-full px-4 text-sm', TONES.success.fill, TONES.success.text)}>{t('shared.pickTime.allIn')}</span>
        ) : !set ? (
          <span className={cx('inline-flex h-9.5 items-center rounded-full px-4 text-sm', TONES.warn.fill, TONES.warn.text)}>
            {latest != null ? dueOn(latest) : t('shared.pickTime.noDate')}
          </span>
        ) : (
          <div className="scrollbar-slim flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-field p-1">
            {pills.map((d) => {
              const on = d === latest
              return (
                <Button
                  key={d}
                  variant="bare"
                  aria-pressed={on}
                  onClick={() => pick(d)}
                  className={cx('h-9.5 shrink-0 rounded-full px-3.5 text-sm whitespace-nowrap transition', on ? 'bg-panel text-brand-700 shadow-[0_2px_6px_-2px_rgba(30,50,80,0.18)]' : 'text-soft hover:text-ink')}
                >
                  {dueOn(d)}
                </Button>
              )
            })}
          </div>
        )}
      </div>
      {days ? (
        <SlotPicker
          days={days}
          day={day}
          onDay={(i) => setShown({ ready, day: i })}
          slots={slots ?? null}
          length={settings.sessionMinutes}
          value={value}
          onChange={onChange}
          flow={flow}
        />
      ) : (
        <p className="py-6 text-sm text-muted">{t('shared.pickTime.loadingDays')}</p>
      )}
    </>
  )
}
