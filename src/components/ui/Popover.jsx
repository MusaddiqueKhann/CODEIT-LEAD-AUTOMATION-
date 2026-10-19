import { cx } from '../../lib/cx.js'

/* Popovers keep a shadow where the cards no longer do — they float over
   content rather than sitting in the layout, so the border alone would let
   them blend into whatever is behind them. Tightened from 2xl/12% to lg/5%:
   enough to lift, not enough to read as a raised object. */
const POPOVER_SURFACE =
  'absolute right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-line bg-panel shadow-lg shadow-black/5'

/** The floating panel under the bell and the search box. Pair with useDismiss. */
export function Popover({ className, children }) {
  return <div className={cx(POPOVER_SURFACE, 'w-[21rem]', className)}>{children}</div>
}
