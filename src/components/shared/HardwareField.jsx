import { useState } from 'react'
import Icon from '../Icon.jsx'
import { dayKey, formatShort, fromDay, monthYear, riyadhNow, startOfDay, weekdayNames } from '../../models/rules/format.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { Button, Modal, cx } from '../ui/index.js'
import { Option } from './Option.jsx'
import { ReadField } from './ReadField.jsx'

/**
 * Where the hardware is, as an index into the Admin's steps (Settings → Lists → Hardware steps):
 * the first is ordered, the last is delivered, any between are on the way. `step` is the step's
 * key; older answers kept a number, or nothing.
 */
function stepOf(v, steps) {
  const last = steps.length - 1
  if (typeof v.step === 'string' && steps.some((s) => s.key === v.step)) return steps.findIndex((s) => s.key === v.step)
  if (typeof v.step === 'number') return Math.min(v.step, last)
  return v.delivered ? last : v.date ? Math.min(1, last) : 0
}

/**
 * Hardware for the ready check: "No hardware", or needs hardware, tracked Ordered → Arriving →
 * Delivered with the arrival date. `value` is { none } or { needs, step, ordered, date, delivered }
 * (dates "YYYY-MM-DD"); the ready check passes on none, delivered, or an arrival date.
 */
export function HardwareField({ value = {}, onChange, readOnly = false }) {
  const { active, label } = useConfig()
  const { t } = useLang()
  const [picking, setPicking] = useState(false)
  const steps = active('hardware_step')
  const last = steps.length - 1
  const name = (i) => label('hardware_step', steps[i]?.key)
  const needs = !value.none && !!(value.needs || value.delivered || value.date)
  const step = stepOf(value, steps)
  const today = startOfDay(riyadhNow())
  const arrives = value.date && fromDay(value.date)
  const days = arrives && Math.round((arrives - today) / 864e5)
  const title = !arrives
    ? t('shared.hardware.noArrival', { step: name(step) })
    : step === 0
      ? t('shared.hardware.arriving', { step: name(0), date: formatShort(arrives) })
      : t('shared.hardware.stepOn', { step: name(step), date: formatShort(arrives) })
  const when = days > 0 ? t('shared.hardware.inDays', { n: days }) : days === 0 ? t('shared.hardware.today') : t('shared.hardware.late', { n: -days })
  const sub = step === last ? t('shared.hardware.withCustomer') : !arrives ? t('shared.hardware.setDay') : t('shared.hardware.beforeSession', { when })

  if (readOnly) return <ReadField>{value.none ? t('shared.hardware.none') : needs ? title : t('shared.hardware.notAnswered')}</ReadField>

  const go = (n) => onChange({ ...value, needs: true, step: steps[n].key, delivered: n === last })
  const stepDate = (i) =>
    i === 0
      ? value.ordered ? formatShort(fromDay(value.ordered)) : '—'
      : i === last
        ? step === last && arrives ? formatShort(arrives) : t('shared.hardware.notYet')
        : arrives ? formatShort(arrives) : t('shared.hardware.noDate')
  const icon = (i) => (i === 0 ? 'box' : i === last ? 'check' : 'truck')
  // Where a step's dot sits along the bar: the first at the start, the last at the end, the rest mid-column.
  const dotAt = (i) => (i === 0 ? '8px' : i === last ? 'calc(100% - 8px)' : `${((i + 0.5) / steps.length) * 100}%`)

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap gap-1.5">
        <Option on={!!value.none} onClick={() => onChange({ none: true })} className="h-10 rounded-full px-4 text-sm whitespace-nowrap">
          {t('shared.hardware.none')}
        </Option>
        <Option
          on={needs}
          onClick={() => !needs && onChange({ needs: true, step: 0, ordered: dayKey(today) })}
          className="h-10 rounded-full px-4 text-sm whitespace-nowrap"
        >
          {t('shared.hardware.needs')}
        </Option>
      </div>
      {needs && (
        <div className="flex animate-rise flex-col gap-5 rounded-[22px] bg-surface-2 px-5.5 py-5">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-brand-700 text-white">
              <Icon name={icon(step)} className="size-5" strokeWidth={1.8} />
            </span>
            <span className="flex min-w-45 flex-1 flex-col gap-0.5">
              <span className="text-[15px] text-ink">{title}</span>
              <span className="text-[13px] text-muted">{sub}</span>
            </span>
            <Button variant="bare" onClick={() => setPicking(true)} className="flex h-9.5 items-center gap-2 rounded-full bg-panel px-3.5 text-[13px] text-brand-700 transition hover:bg-brand-100">
              <Icon name="calendar" className="size-3.75" strokeWidth={1.8} />
              {t(arrives ? 'shared.hardware.changeDate' : 'shared.hardware.setDate')}
            </Button>
          </div>
          <div className="relative grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.slice(1).map((s, i) => (
              <span
                key={s.key}
                style={{ insetInlineStart: dotAt(i), insetInlineEnd: `calc(100% - ${dotAt(i + 1)})` }}
                className={cx('absolute top-1.75 h-0.5 transition-colors', step > i ? 'bg-brand-700' : 'bg-[#dfe7e7]')}
              />
            ))}
            {steps.map((s, i) => (
              <Button
                key={s.key}
                variant="bare"
                aria-pressed={i === step}
                onClick={() => go(i)}
                className={cx('relative flex flex-col gap-1.5', i === 0 ? 'items-start text-start' : i === last ? 'items-end text-end' : 'items-center text-center')}
              >
                <span
                  className={cx(
                    'size-4 rounded-full transition',
                    i < step ? 'bg-brand-700' : i === step ? 'bg-panel shadow-[inset_0_0_0_4px_#367b7f]' : 'bg-panel shadow-[inset_0_0_0_2px_#dfe7e7]',
                  )}
                />
                <span className={cx('text-sm', i <= step ? 'text-ink' : 'text-muted')}>{name(i)}</span>
                <span className="text-xs text-muted">{stepDate(i)}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
      {picking && (
        <ArrivalDialog
          value={arrives ?? today}
          today={today}
          onClose={() => setPicking(false)}
          onSet={(d) => {
            onChange({ ...value, needs: true, step: steps[Math.max(step, Math.min(1, last))].key, date: dayKey(d) })
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

/** A month to pick the arrival day from; days before today can't be picked. */
function ArrivalDialog({ value, today, onClose, onSet }) {
  const { t } = useLang()
  const [pick, setPick] = useState(value)
  const [month, setMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1))
  const blanks = month.getDay()
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const days = Math.round((pick - today) / 864e5)
  const shift = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t('shared.hardware.arrival')}
      description={t('shared.hardware.arrivalSub')}
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button className="flex-1" onClick={() => onSet(pick)}>
            {t('shared.hardware.setDate')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button variant="bare" aria-label={t('shared.hardware.previousMonth')} onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-full bg-surface text-ink hover:bg-surface-hover">
            <Icon name="chevronLeft" className="size-4" strokeWidth={2} />
          </Button>
          <span className="text-sm text-ink">{monthYear(month)}</span>
          <Button variant="bare" aria-label={t('shared.hardware.nextMonth')} onClick={() => shift(1)} className="grid size-9 place-items-center rounded-full bg-surface text-ink hover:bg-surface-hover">
            <Icon name="chevronRight" className="size-4" strokeWidth={2} />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdayNames('narrow').map((w, i) => (
            <span key={i} className="pb-1 text-[11px] text-faint">
              {w}
            </span>
          ))}
          {Array.from({ length: blanks }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {Array.from({ length: count }, (_, i) => {
            const d = new Date(month.getFullYear(), month.getMonth(), i + 1)
            const on = +d === +pick
            const past = d < today
            return (
              <Button
                key={i}
                variant="bare"
                disabled={past}
                aria-pressed={on}
                onClick={() => setPick(d)}
                className={cx(
                  'h-10 rounded-xl text-sm transition',
                  on ? 'bg-brand-700 text-white' : past ? 'text-ghost' : 'text-ink hover:bg-surface',
                  !on && +d === +today && 'ring-[1.5px] ring-brand-200 ring-inset',
                )}
              >
                {i + 1}
              </Button>
            )
          })}
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-3.5 py-3">
          <Icon name="calendar" className="size-4 text-brand-700" strokeWidth={1.8} />
          <span className="flex-1 text-sm text-ink">{formatShort(pick)} {pick.getFullYear()}</span>
          <span className="text-xs text-muted">{days === 0 ? t('shared.hardware.today') : t('shared.hardware.inDays', { n: days })}</span>
        </div>
      </div>
    </Modal>
  )
}
