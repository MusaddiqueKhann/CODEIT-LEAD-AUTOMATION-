import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { Notice } from '@/components'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { STEP_ROLE, stepState } from '../../../models/rules/stages.js'

/**
 * The line at the top of a step's tab: skipped, not started yet, or view only and whose step it
 * is. Nothing when this person can work on it.
 */
export function StepNote({ member: m, step, mine }) {
  const { label, person } = useConfig()
  const { t } = useLang()
  if (step === 'overview') return null
  if (step === 'integration' && m.integrations.length === 0) {
    return <Notice size="md" tone="neutral" icon="info">{t('shared.member.stepNote.skipped')}</Notice>
  }
  const state = stepState(m, step)
  const role = STEP_ROLE[step]
  const who = role && person(m.people[role])
  if (state === 'todo' && !m.outcome) {
    return (
      <Notice size="md" tone="neutral" icon="clock">
        {[
          step === 'integration' ? t('shared.member.stepNote.startsAfterTransfer') : t('shared.member.stepNote.startsAtHandover', { step: label('step', 'onboarding') }),
          who && t('shared.member.stepNote.picked', { name: who.name }),
          t('shared.member.stepNote.nothingYet'),
        ]
          .filter(Boolean)
          .join(' ')}
      </Notice>
    )
  }
  if (mine) return null
  if (state === 'done') return <Notice size="md" tone="success" icon="checkCircle">{who ? t('shared.member.stepNote.doneBy', { name: who.name }) : t('shared.member.stepNote.done')}</Notice>
  return (
    <Notice size="md" tone="neutral" icon="eye">
      {who ? t('shared.member.stepNote.viewOnlyBy', { name: who.name, role: label('role', role) }) : t('shared.member.stepNote.viewOnlyNobody')}
    </Notice>
  )
}
