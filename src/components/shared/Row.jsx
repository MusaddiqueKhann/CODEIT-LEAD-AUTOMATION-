/** Label and hint in a 220px column, the controls beside it; stacks when narrow. */
export function Row({ title, sub, children }) {
  return (
    <div className="grid gap-x-7 gap-y-3 border-b border-line py-5 last:border-b-0 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-medium tracking-[-0.01em] text-ink">{title}</span>
        <span className="text-[13px] leading-normal text-muted">{sub}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-2.5">{children}</div>
    </div>
  )
}
