import { Card } from '../ui/index.js'

/**
 * One of the design's tall number cards: a title with a pill or button beside it, a big number
 * with its unit, and a line under it. `small` sets the big value at 22px, for text such as a
 * phone number.
 */
export function StatTile({ title, aside, big, unit, sub, small = false, index = 0 }) {
  return (
    <Card
      radius="rounded-tile"
      padding="none"
      style={{ animationDelay: `${0.12 + index * 0.06}s` }}
      className="flex min-h-38 min-w-0 animate-rise flex-col gap-2 px-5.5 py-5 transition duration-250 hover:-translate-y-0.75 hover:shadow-lift"
    >
      <div className="mb-auto flex min-h-8 items-center justify-between gap-2">
        <span className="text-tile text-ink">{title}</span>
        {aside}
      </div>
      {small ? (
        <span dir="ltr" className="self-start pt-3 text-lg tracking-[-0.01em] text-ink">
          {big}
        </span>
      ) : (
        <span className="pt-3 text-stat text-ink">
          {big}
          {unit && <span className="text-sm tracking-normal text-faint"> {unit}</span>}
        </span>
      )}
      <span className="line-clamp-2 text-[13px] text-soft">{sub}</span>
    </Card>
  )
}
