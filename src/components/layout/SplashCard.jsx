import { Card } from '../ui/Card.jsx'

/** The glass card on the splash (sign-in pages and the customer's page): a title, a line under it, then the content. */
export function SplashCard({ title, sub, children }) {
  return (
    <Card
      radius="rounded-[28px]"
      padding="none"
      surface="border-white/40 bg-panel/95"
      className="w-full max-w-md p-8 shadow-2xl backdrop-blur-xl sm:p-10"
    >
      <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
      {sub && <p className="mt-1.5 text-sm text-muted">{sub}</p>}
      {children}
    </Card>
  )
}
