import Icon from '../Icon.jsx'
import { Button, cx } from '../ui/index.js'
import { weekdayShort } from '../../lib/format.js'
import { STEPS } from './steps.js'
import { StepBlock } from './StepBlock.jsx'

/**
 * The wizard's left rail: the step counter and progress strip, one StepBlock
 * per step, and the quick picks pinned to the bottom.
 *
 * `values` and `hints` are per-step — what was chosen, and a one-line prompt
 * for the current step. `picks` are real open (day, slot) pairs the page has
 * already vetted; each is a shortcut straight to the review step.
 */
export function StepRail({ step, values, hints, onStep, picks, onPick }) {
  return (
    <aside className="scrollbar-slim flex min-h-0 flex-col overflow-y-auto lg:border-r lg:border-line lg:pr-8">
      <div className="mb-2 flex items-center justify-between">
        <p className="eyebrow text-muted">Booking</p>
        <p className="text-[11px] font-medium text-muted">
          {step} / {STEPS.length}
        </p>
      </div>
      <div className="mb-5 grid grid-cols-3 gap-1.5" aria-hidden="true">
        {STEPS.map(({ eyebrow }, i) => (
          <span
            key={eyebrow}
            className={cx(
              'h-1 rounded-full transition-colors duration-300',
              i < step ? 'bg-brand-800' : 'bg-line',
            )}
          />
        ))}
      </div>

      <nav aria-label="Booking steps" className="flex flex-col gap-1.5">
        {STEPS.map(({ eyebrow, title }, i) => {
          const n = i + 1
          return (
            <StepBlock
              key={eyebrow}
              state={n < step ? 'done' : n === step ? 'current' : 'upcoming'}
              number={n}
              eyebrow={eyebrow}
              title={title}
              value={values[i]}
              hint={hints[i]}
              onClick={() => onStep(n)}
            />
          )
        })}
      </nav>

      {picks.length > 0 && (
        <div className="mt-auto pt-6">
          <p className="eyebrow mb-2.5 text-muted">Quick picks</p>
          <div className="flex flex-col gap-2">
            {picks.map((pick, i) => (
              <Button
                key={pick.label}
                variant="bare"
                onClick={() => onPick(pick)}
                className={cx(
                  'flex w-full items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-left text-[13px] transition hover:bg-brand-100 short:py-1.5',
                  i >= 2 && 'short:hidden',
                )}
              >
                <span className="truncate text-muted">{pick.label}</span>
                <span className="flex shrink-0 items-center gap-0.5 font-bold text-brand-900">
                  {weekdayShort(pick.date)} {pick.date.getDate()}, {pick.time}
                  <Icon name="chevronRight" className="size-3.5" strokeWidth={2.6} />
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
