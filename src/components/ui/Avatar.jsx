import { cx } from '../cx.js'

const SIZES = {
  xs: 'size-6 text-[9px]',
  sm: 'size-9.5 text-xs',
  md: 'size-11 text-[13px]',
  lg: 'size-14 text-lg',
}

/** A person: initials on the deep teal circle, or their photo when there is one (`src`). */
export function Avatar({ initials, src, size = 'md', className }) {
  if (src) return <img src={src} alt="" className={cx('shrink-0 rounded-full object-cover', SIZES[size], className)} />
  return (
    <div className={cx('flex shrink-0 items-center justify-center rounded-full bg-brand-900 text-white', SIZES[size], className)}>
      {initials}
    </div>
  )
}
