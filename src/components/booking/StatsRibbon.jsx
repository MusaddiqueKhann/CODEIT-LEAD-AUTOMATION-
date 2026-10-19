import { Ring, RingTile, cx } from '../ui/index.js'
import { user } from '../../data/mockData.js'
import { CARD_TONE, TONES } from '../../lib/tones.js'

/**
 * The three allowance tiles above the booking wizard: free sessions on the
 * deep gradient, paid on the warn wash with its top-up link, attended on the
 * light gradient. The two gradients are borderless by design, so those tiles
 * drop the hairline. `onAddSessions` comes from the page, which owns navigation.
 */
export function StatsRibbon({ allowance, onAddSessions }) {
  const { freeLeft, freeTotal, paidBalance, attended } = allowance
  const used = Math.max(freeTotal - freeLeft, 0)

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-[1.35fr_1fr_1fr]">
      <RingTile
        bordered={false}
        surface="bg-gradient-to-br from-brand-700 via-brand-900 to-deep"
        gap="gap-5"
        eyebrow="Free sessions left"
        eyebrowClass="text-accent"
        ring={
          <Ring
            value={freeLeft}
            max={freeTotal}
            size={72}
            thickness={7}
            arc="text-accent"
            track="text-white/15"
            label={`${freeLeft} of ${freeTotal} free sessions left`}
          >
            <span className="text-lg leading-none font-bold text-on-brand-light">
              {freeLeft}/{freeTotal}
            </span>
            <span className="mt-1 text-[9px] font-semibold tracking-[0.12em] text-accent uppercase">
              Free
            </span>
          </Ring>
        }
      >
        <p className="mt-1.5 text-[13px] text-deep-muted">
          You've used {used} of {freeTotal} complimentary sessions this cycle.
        </p>
      </RingTile>

      <RingTile
        surface={CARD_TONE.warn}
        eyebrow="Paid sessions"
        eyebrowClass={TONES.warn.text}
        link={{ label: 'Add sessions', onClick: onAddSessions }}
        ring={
          <Ring
            value={paidBalance}
            max={3}
            size={64}
            thickness={6}
            tone="warn"
            label={`${paidBalance} paid session${paidBalance === 1 ? '' : 's'} available`}
          >
            <span className={cx('text-lg font-bold', TONES.warn.text)}>{paidBalance}</span>
          </Ring>
        }
      />

      <RingTile
        bordered={false}
        surface="bg-gradient-to-br from-brand-100 to-brand-200"
        eyebrow="Attended"
        eyebrowClass="text-brand-800"
        ring={
          <Ring
            value={1}
            max={1}
            size={64}
            thickness={6}
            arc="text-brand-600"
            track="text-white/60"
            label={`${attended} sessions attended`}
          >
            <span className="text-lg font-bold text-ink">{attended}</span>
          </Ring>
        }
      >
        <p className="mt-1 truncate text-sm text-brand-900">since {user.memberSince}</p>
      </RingTile>
    </div>
  )
}
