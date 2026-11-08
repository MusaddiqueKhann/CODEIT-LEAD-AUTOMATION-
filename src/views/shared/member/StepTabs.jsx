import { Fragment } from 'react'
import { Button, Card, cx, Icon } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { STEP_ROLE, STEPS, stepState } from '../../../models/rules/stages.js'

/* Where Onboarding is, under its step: shared.member.tabs.<word>. */
const ONBOARDING_PART = { setup: 'setupChecklist', session: 'session', recording: 'recording' }

/**
 * The design's two tab cards: Overview on its own, then the steps as a numbered stepper. A done
 * step shows a tick, the step it is at a ringed number; each says who has it (Integration reads
 * "Skipped" when none was picked, and then doesn't open). Clicking one opens it below; the open one
 * sits on a soft wash.
 */
export function StepTabs({ member: m, tab, onTab }) {
  const { label, person } = useConfig()
  const { t } = useLang()
  const steps = STEPS.map((step) => {
    const state = stepState(m, step)
    const skip = step === 'integration' && m.integrations.length === 0
    const sub = skip ? t('shared.member.tabs.skipped') : state === 'now' && step === 'onboarding' ? t(`shared.member.tabs.${ONBOARDING_PART[m.stage]}`) : person(m.people[STEP_ROLE[step]])?.name
    return { step, state, sub, skip }
  })
  const overview = tab === 'overview'

  return (
    <div className="flex animate-rise flex-wrap gap-4 [animation-delay:.05s]">
      <Card as="nav" aria-label={t('shared.member.tabs.overview')} padding="none" className="flex shrink-0 items-center p-3">
        <Button id="step-tabs-overview"
          variant="bare"
          aria-pressed={overview}
          onClick={() => onTab('overview')}
          className={cx('flex h-11 items-center gap-2 rounded-full px-5 text-[13px] whitespace-nowrap transition-colors duration-300', overview ? 'bg-brand-700 text-white' : 'bg-surface text-ink hover:bg-surface-hover')}
        >
          <Icon name="overview" className="size-4" strokeWidth={1.8} />
          {t('shared.member.tabs.overview')}
        </Button>
      </Card>
      <Card as="nav" aria-label={t('shared.member.tabs.steps')} padding="none" className="scrollbar-slim flex min-w-0 flex-[1_1_780px] items-center justify-between overflow-x-auto p-3">
        {steps.map(({ step, state, sub, skip }, i) => {
          const done = state === 'done'
          const now = state === 'now'
          const open = tab === step
          return (
            <Fragment key={step}>
              <Button id={`step-tabs-on-tab-${step}`}
                variant="bare"
                aria-pressed={open}
                aria-current={now ? 'step' : undefined}
                disabled={skip}
                onClick={() => onTab(step)}
                className={cx(
                  'flex h-13 shrink-0 items-center gap-2 rounded-full ps-2 pe-3 transition-colors',
                  skip ? 'cursor-default opacity-60' : 'hover:bg-surface-2',
                  open && 'bg-track',
                  m.outcome && 'opacity-60',
                )}
              >
                <span
                  className={cx(
                    'grid size-7.5 shrink-0 place-items-center rounded-full text-xs transition',
                    done ? 'bg-brand-700 text-white' : now ? 'bg-panel text-brand-700 shadow-[inset_0_0_0_2px_var(--color-brand-700),0_0_0_5px_var(--color-brand-150)]' : 'bg-surface text-faint',
                  )}
                >
                  {done ? <Icon name="check" className="size-3.25" strokeWidth={2.8} /> : i + 1}
                </span>
                <span className="flex flex-col text-start">
                  <span className={cx('text-[13px] whitespace-nowrap', done || now || open ? 'text-ink' : 'text-soft')}>{label('step', step)}</span>
                  {sub && <span className="max-w-24 truncate text-[11px] whitespace-nowrap text-faint">{sub}</span>}
                </span>
              </Button>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cx('mx-0.5 flex min-w-5 flex-[1_1_40px] items-center justify-center', done ? 'text-brand-700' : now ? 'text-brand-300' : 'text-off')}
                >
                  {[0, 1, 2].map((n) => (
                    <Icon key={n} name="chevronRight" className="size-2.5" strokeWidth={3} />
                  ))}
                </span>
              )}
            </Fragment>
          )
        })}
      </Card>
    </div>
  )
}
