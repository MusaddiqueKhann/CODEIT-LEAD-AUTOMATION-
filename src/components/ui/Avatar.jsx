import { cx } from '../../lib/cx.js'

const TONES = {
  /* The 700→900 gradient is back — the ramp has distinct ends again, so it
     renders as an actual gradient rather than one flat colour. Initials take
     white for the same reason the primary button does: at size sm they are
     12px, and the 700 end of the sweep gives soft white only 4.499:1. White
     holds 4.83:1 at the lightest point and climbs from there. */
  brand: 'bg-gradient-to-br from-brand-700 to-brand-900 text-white',
  /* For the sidebar, which is a brand-700 panel — a ramp-step fill there would
     either vanish into the panel or gradient down into it. A translucent white
     wash instead, so the disc reads as a lighter lift of whatever it sits on.
     White initials, per the rule that small text on a 700 fill takes pure
     white. */
  deep: 'bg-white/20 text-white',
}

const SIZES = {
  sm: 'size-9 text-xs',
  md: 'size-10.5 text-[13px]',
  lg: 'size-18 text-2xl',
}

export function Avatar({ initials, size = 'md', tone = 'brand', className }) {
  return (
    <div
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      {initials}
    </div>
  )
}
