import Icon from '../Icon.jsx'
import { Button, Card, IconTile } from '../ui/index.js'
import { SESSION_FORMAT } from '../../data/mockData.js'
import { formatLong, weekOf } from '../../lib/format.js'
import { partOfDay, slotEnd } from '../../lib/schedule.js'
import { STEPS } from './steps.js'
import { StepHeader } from './StepHeader.jsx'

/**
 * The review step: date, time and plan as three rows. The first two carry a
 * "Change" link back to their step; the plan row carries a tick, or a warning
 * tile when the plan has a tone. `unchanged` (a move to the very same slot)
 * swaps the plan for a notice saying so.
 */
export function ConfirmScreen({ date, time, moving, cost, unchanged, onEdit, className }) {
  const { minutes, mode } = SESSION_FORMAT

  const plan = unchanged
    ? { tone: 'warn', title: 'Same slot as now', subtitle: 'Pick a different day or time to move.' }
    : cost

  const rows = [
    { tag: 'Date', title: formatLong(date), subtitle: weekOf(date), edit: 1 },
    {
      tag: 'Time',
      title: `${time} – ${slotEnd(time, minutes)}`,
      subtitle: `${partOfDay(time)} · ${minutes} min ${mode}`,
      edit: 2,
    },
    { tag: 'Plan', title: plan.title, subtitle: plan.subtitle, tone: plan.tone },
  ]

  return (
    <div className={className}>
      <StepHeader
        title={moving ? 'Review your move' : 'Review your booking'}
        meta={`Step ${STEPS.length} of ${STEPS.length}`}
      />

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <Card
            key={row.tag}
            radius="rounded-xl"
            padding="none"
            surface={row.edit ? 'border-line bg-panel' : 'border-transparent bg-surface'}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3.5"
          >
            <span className="inline-flex h-7 items-center justify-center rounded-lg bg-surface-2 px-3 text-[11px] font-bold tracking-[0.08em] text-brand-900 uppercase">
              {row.tag}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg leading-tight font-bold text-ink">
                {row.title}
              </span>
              <span className="mt-0.5 block truncate text-[13px] text-muted">{row.subtitle}</span>
            </span>
            {row.edit ? (
              <Button
                variant="bare"
                onClick={() => onEdit(row.edit)}
                className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-900 transition hover:text-brand-700"
              >
                Change
                <Icon name="chevronRight" className="size-3.5" strokeWidth={2.6} />
              </Button>
            ) : row.tone ? (
              <IconTile name="alert" tone={row.tone} size="sm" />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-800 text-white">
                <Icon name="check" className="size-3.5" strokeWidth={2.8} />
              </span>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
