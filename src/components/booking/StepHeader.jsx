import { cx } from '../ui/index.js'

/**
 * The heading over a wizard step: a bold title on the left, a small meta line
 * on the right, baseline-aligned. The time step and the review screen both
 * open with it.
 */
export function StepHeader({ title, meta, className }) {
  return (
    <div className={cx('mb-4 flex items-baseline justify-between gap-4', className)}>
      <p className="text-lg leading-none font-bold text-ink">{title}</p>
      <p className="text-[13px] text-muted">{meta}</p>
    </div>
  )
}
