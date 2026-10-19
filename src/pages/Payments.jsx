import { useState } from 'react'
import { PageHeader } from '../components/layout/index.js'
import {
  Badge,
  ConfirmDialog,
  List,
  ListRow,
  SectionHeader,
  StatCard,
} from '../components/ui/index.js'
import { BundleCard, PendingBanner, TransferCard } from '../components/payments/index.js'
import { useBookings } from '../context/BookingContext.jsx'
import { useCopy } from '../hooks/useCopy.js'
import { SESSION_BUNDLES, paymentHistory, user } from '../data/mockData.js'
import { formatMedium, formatMoney } from '../lib/format.js'
import { STATUS_TONE } from '../lib/tones.js'

export default function Payments() {
  const { allowance, totalAvailable, paymentStatus, flagPayment } = useBookings()
  const copy = useCopy()
  const [bundleId, setBundleId] = useState(SESSION_BUNDLES[0].id)
  const [confirming, setConfirming] = useState(false)

  const bundle = SESSION_BUNDLES.find((b) => b.id === bundleId) ?? SESSION_BUNDLES[0]

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Top up your balance by bank transfer, then flag it for verification."
      />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <StatCard label="Free sessions" icon="refresh" value={allowance.freeLeft} suffix={`/${allowance.freeTotal}`} />
        <StatCard label="Paid balance" icon="wallet" value={allowance.paidBalance} />
        <StatCard label="Total available" icon="check" value={totalAvailable}>
          <p className="text-sm text-muted">ready to book</p>
        </StatCard>
      </div>

      {paymentStatus === 'pending' && <PendingBanner />}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <section>
            <SectionHeader title="Choose a bundle" className="mb-3" />
            <div className="grid gap-3 sm:grid-cols-3">
              {SESSION_BUNDLES.map((b) => (
                <BundleCard
                  key={b.id}
                  bundle={b}
                  selected={b.id === bundleId}
                  onSelect={setBundleId}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Payment history" className="mb-3" />
            <List>
              {paymentHistory.map((p) => (
                <ListRow
                  key={p.id}
                  icon="bank"
                  tone={STATUS_TONE[p.status] ?? 'neutral'}
                  title={formatMoney(p.amount)}
                  subtitle={`${p.reference} · ${p.sessions} session${p.sessions === 1 ? '' : 's'} · ${formatMedium(p.at)}`}
                  trailing={
                    <Badge dot tone={STATUS_TONE[p.status] ?? 'neutral'}>
                      {p.status}
                    </Badge>
                  }
                />
              ))}
            </List>
          </section>
        </div>

        <TransferCard bundle={bundle} onCopy={copy} onConfirm={() => setConfirming(true)} />
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={flagPayment}
        tone="brand"
        title="Flag this transfer?"
        description={`We'll tell an admin to look for ${formatMoney(bundle.price)} under reference ${user.reference}. Your ${bundle.sessions === 1 ? 'session unlocks' : 'sessions unlock'} once it's verified.`}
        confirmLabel="Notify admin"
      />
    </>
  )
}
