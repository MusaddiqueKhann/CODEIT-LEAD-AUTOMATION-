import { useState } from 'react'
import { Button, Card, cx, Select, Switch, Textarea } from '@/components'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { weekdayNames } from '../../../models/rules/format.js'
import { toTime } from '../../../models/rules/time.js'
import { hourOf } from '../../../models/rules/week.js'

const START = 6
const SPAN = 16 // 06:00 to 22:00, the width of every bar
const TIMES = Array.from({ length: SPAN * 2 + 1 }, (_, i) => toTime((START * 60) + i * 30))
const STRIPES = 'bg-[repeating-linear-gradient(135deg,var(--color-warn)_0_6px,var(--color-warn-stripe-2)_6px_12px)]'

function TimeSelect({ id, value, onChange, label }) {
  return (
    <label className="relative flex">
      <Select bare id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-[10px] bg-field ps-2.5 pe-7 text-[13px] text-ink tabular-nums outline-none"
      >
        {TIMES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-3.5 end-2.75 size-3 fill-none stroke-soft stroke-[2.4]" aria-hidden="true">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  )
}

/**
 * A person's working week, a bar per day on a 06:00–22:00 track. "Edit hours" turns the bars into
 * switches and times; "Done" saves them (as their own hours). The note under it saves on leaving
 * the box. While they are on leave the bars turn to amber stripes and a line says until when.
 */
export function HoursCard({ person, hours, leaveUntil, onSaveHours, onSaveNote }) {
  const { t } = useLang()
  const [draft, setDraft] = useState(null)
  const [note, setNote] = useState(person.teamNote ?? '')
  const editing = draft !== null
  const days = draft ?? hours
  const on = days.filter((d) => d.on)
  const total = on.reduce((s, d) => s + hourOf(d.to) - hourOf(d.from), 0)
  const first = person.name.split(' ')[0]
  const short = weekdayNames()
  const span = on.length ? t('admin.person.hours.span', { from: short[days.indexOf(on[0])], to: short[days.lastIndexOf(on.at(-1))] }) : t('admin.person.hours.noDays')

  const set = (i, patch) =>
    setDraft(
      days.map((d, n) => {
        if (n !== i) return d
        const next = { ...d, ...patch }
        // Keep the end after the start, an hour apart, as the design does.
        if (patch.from && next.to <= next.from) next.to = toTime(Math.min((START + SPAN) * 60, hourOf(next.from) * 60 + 60))
        if (patch.to && next.from >= next.to) next.from = toTime(Math.max(START * 60, hourOf(next.to) * 60 - 60))
        return next
      }),
    )

  const toggleEdit = async () => {
    if (!editing) return setDraft(hours.map((d) => ({ ...d })))
    if (await onSaveHours(draft)) setDraft(null)
  }

  return (
    <Card id="hours-card-title" as="section" padding="none" className="flex min-w-0 flex-[1_1_400px] animate-rise flex-col gap-4.5 px-6 pt-6 pb-6 [animation-delay:.36s]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-h2 text-ink">{t('admin.person.hours.title')}</h2>
          <p className="text-[13px] text-muted">{t('admin.person.hours.days', { n: on.length, span })}</p>
        </div>
        <Button id="hours-card-done" size="sm" variant={editing ? 'primary' : 'soft'} onClick={toggleEdit} className="shrink-0">
          {editing ? t('shared.common.done') : t('admin.person.hours.editHours')}
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        {days.map((d, i) => (
          <div key={weekdayNames('long')[i]} className="flex min-h-9.5 items-center gap-3 px-1">
            <Switch id={`hours-card-${i}-on`} on={d.on} label={weekdayNames('long')[i]} disabled={!editing} onChange={(v) => set(i, { on: v })} className={editing ? '' : 'opacity-85'} />
            <span className={cx('w-9 text-[13px] rtl:w-16', d.on ? 'text-ink' : 'text-ghost')}>{short[i]}</span>
            {editing && d.on ? (
              <span className="flex flex-1 items-center justify-end gap-2">
                <TimeSelect id={`hours-card-${i}-from`} label={t('shared.components.hours.dayFrom', { day: weekdayNames('long')[i] })} value={d.from} onChange={(from) => set(i, { from })} />
                <span className="text-faint">–</span>
                <TimeSelect id={`hours-card-${i}-to`} label={t('shared.components.hours.dayTo', { day: weekdayNames('long')[i] })} value={d.to} onChange={(to) => set(i, { to })} />
              </span>
            ) : (
              <>
                <span className="relative h-2.5 flex-1 rounded-full bg-line">
                  {d.on && (
                    <span
                      className={cx('absolute inset-y-0 rounded-full transition-all duration-300', leaveUntil ? STRIPES : 'bg-brand-700')}
                      style={{ insetInlineStart: `${((hourOf(d.from) - START) / SPAN) * 100}%`, width: `${((hourOf(d.to) - hourOf(d.from)) / SPAN) * 100}%` }}
                    />
                  )}
                </span>
                <span className={cx('w-24 text-end text-xs whitespace-nowrap tabular-nums', d.on ? 'text-ink' : 'text-ghost')}>
                  {d.on ? `${d.from} – ${d.to}` : t('admin.person.hours.off')}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between px-0.5 text-xs text-muted">
        <span>{t('admin.person.hours.perWeek', { hours: Number.isInteger(total) ? total : total.toFixed(1) })}</span>
        <span>{t('admin.person.hours.riyadh')}</span>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] text-muted">{t('admin.person.hours.note')}</span>
        <Textarea bare id="hours-card-note-placeholder"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note.trim() !== (person.teamNote ?? '') && onSaveNote(note)}
          placeholder={t('admin.person.hours.notePlaceholder')}
          className="min-h-14 w-full resize-y rounded-xl bg-field px-3.5 py-2.5 text-[13px] leading-[1.55] text-ink outline-none placeholder:text-ghost focus:bg-panel focus:ring-[1.5px] focus:ring-brand-700 focus:ring-inset"
        />
      </label>

      {leaveUntil && (
        <p className="rounded-2xl bg-warn-wash px-4 py-3 text-[13px] text-warn-ink">
          {t('admin.person.hours.onLeave', { date: leaveUntil, name: first })}
        </p>
      )}
    </Card>
  )
}
