import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { STEP_TONE, statusOf } from '../../models/rules/stages.js'
import { TONES } from '../tones.js'
import { cx } from '../ui/index.js'

/**
 * Where a member is now: its step, or Lost / Cancelled, as the design's fixed-width pill. The
 * words come from the `step` list. `className` sets the size where a list wants a smaller pill.
 */
export function StepBadge({ member, step, className = 'h-7 w-30 text-[13px]' }) {
  const { label } = useConfig()
  const status = step ?? statusOf(member)
  const tone = TONES[STEP_TONE[status]]
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center truncate rounded-full px-3 whitespace-nowrap', tone.fill, tone.text, className)}>
      {label('step', status)}
    </span>
  )
}
