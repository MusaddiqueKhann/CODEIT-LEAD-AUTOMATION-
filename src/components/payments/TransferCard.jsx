import { Button, Card, CopyRow } from '../ui/index.js'
import { BANK_DETAILS, user } from '../../data/mockData.js'
import { formatMoney } from '../../lib/format.js'

/**
 * The sticky "Transfer to" aside: the bank details with copy buttons, the
 * amount for the chosen bundle, and the button that flags the transfer.
 *
 * `onCopy` comes from the page (useCopy) so this stays a presentational card;
 * `onConfirm` opens the page's confirm dialog.
 */
export function TransferCard({ bundle, onCopy, onConfirm }) {
  return (
    <Card as="aside" padding="lg" className="h-fit lg:sticky lg:top-6">
      <p className="eyebrow text-muted">Transfer to</p>

      <div className="mt-3">
        <CopyRow label="Bank" value={BANK_DETAILS.bank} mono={false} onCopy={onCopy} />
        <CopyRow label="Account name" value={BANK_DETAILS.accountName} mono={false} onCopy={onCopy} />
        <CopyRow label="IBAN" value={BANK_DETAILS.iban} onCopy={onCopy} />
        <CopyRow label="SWIFT" value={BANK_DETAILS.swift} onCopy={onCopy} />
        {/* The reference is what lets an admin match the transfer to this
            account, so it sits with the bank details rather than in a note
            below them. */}
        <CopyRow label="Your reference" value={user.reference} onCopy={onCopy} />
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
        <span className="text-sm text-muted">Amount</span>
        <span className="text-[22px] leading-none font-bold text-ink">
          {formatMoney(bundle.price)}
        </span>
      </div>
      <p className="mt-1.5 text-right text-xs text-muted">
        unlocks {bundle.sessions} session{bundle.sessions === 1 ? '' : 's'}
      </p>

      <Button className="mt-5" fullWidth size="lg" icon="check" onClick={onConfirm}>
        I’ve made the transfer
      </Button>
      <p className="mt-3 text-center text-xs text-muted">
        Include your reference or the transfer can’t be matched.
      </p>
    </Card>
  )
}
