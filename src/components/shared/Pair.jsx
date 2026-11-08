/** Two controls side by side, stacking below ~400px. */
export function Pair({ children }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-2.5">{children}</div>
}
