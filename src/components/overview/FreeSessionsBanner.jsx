import { Ring } from '../ui/index.js'
import { useBookings } from '../../context/BookingContext.jsx'

/**
 * The free-allowance banner — a mint band with the donut carrying the count.
 *
 * The ring sits on its own white disc so the unfilled remainder reads as a
 * quiet gap rather than a second colour; the arc is the only ink on it.
 */
export function FreeSessionsBanner() {
  const { allowance } = useBookings()
  const { freeLeft, freeTotal } = allowance
  const used = Math.max(freeTotal - freeLeft, 0)

  return (
    <section className="flex flex-wrap items-center gap-x-8 gap-y-5 rounded-3xl bg-gradient-to-r from-brand-100 to-brand-50 px-7 py-6 sm:px-9">
      <Ring
        value={freeLeft}
        max={freeTotal}
        size={108}
        thickness={12}
        arc="text-brand-700"
        track="text-white"
        label={`${freeLeft} of ${freeTotal} free sessions left`}
        className="rounded-full bg-white"
      >
        <span className="text-[22px] leading-none font-bold text-ink">
          {freeLeft}/{freeTotal}
        </span>
        <span className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
          Free
        </span>
      </Ring>

      <div className="min-w-0 flex-1">
        {/* brand-800 on the 100 wash is the same 6.89:1 pair the chips use. */}
        <p className="eyebrow text-brand-800">Free sessions left</p>
        <p className="mt-2 text-[15px] text-brand-900">
          You've used {used} of your {freeTotal} complimentary sessions this cycle. Book before
          they reset.
        </p>
      </div>
    </section>
  )
}
