import { Card, cx } from '../ui/index.js'

/**
 * The shell both My Bookings rows share: a free-standing card row with the
 * session tile, a bold title and a muted subtitle on the left, and the row's
 * actions (`children`) on the right.
 *
 * `hero` swaps the card for the deep gradient — borderless and shadowed, the
 * treatment Overview's hero gives the next session — and lifts the text to the
 * on-dark tones. Free-standing cards with a gutter rather than a divided List,
 * so the hero can sit dark among the rest.
 */
export function SessionRow({ hero = false, tile, title, subtitle, children }) {
  return (
    <Card
      as="li"
      padding="none"
      bordered={!hero}
      surface={hero ? 'bg-gradient-to-br from-deep to-brand-900' : undefined}
      className={cx(
        'flex flex-wrap items-center justify-between gap-x-5 gap-y-4 px-6 py-5',
        hero && 'shadow-[0_24px_60px_-32px_rgba(18,48,51,0.6)]',
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        {tile}
        <div className="min-w-0">
          <p
            className={cx(
              'truncate text-[15px] font-bold',
              hero ? 'text-on-brand-light' : 'text-ink',
            )}
          >
            {title}
          </p>
          <p className={cx('mt-0.5 truncate text-[13px]', hero ? 'text-deep-muted' : 'text-muted')}>
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </Card>
  )
}
