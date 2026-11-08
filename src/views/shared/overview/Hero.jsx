import { Link } from 'react-router-dom'
import { Icon } from '@/components'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { ROUTES } from '../../../routes/paths.js'
import { Ring } from './Ring.jsx'

/**
 * The teal greeting card that opens a dashboard: a ring of `parts` ([{ key, label, n, color, to,
 * ring? }]) round their total (`unit` under it), the greeting, the bell with the unread count, and
 * a tile per part. A part with `ring: false` (one already counted in another) gets a tile only;
 * one with `tile: false` is in the ring only.
 * `round` gives the ring's parts round ends with a gap between.
 */
export function Hero({ title, sub, unread, unit, parts, round = false }) {
  const { t } = useLang()
  const inRing = parts.filter((p) => p.ring !== false)
  const total = inRing.reduce((n, p) => n + p.n, 0)

  return (
    <section id="hero" className="v-hero__hero flex animate-rise flex-wrap items-center justify-center gap-x-10 gap-y-6 rounded-card bg-brand-700 px-6 py-6 text-white">
      <Ring size={180} stroke={22} total={total} track="rgb(255 255 255 / 0.15)" round={round} parts={inRing.map((p) => ({ value: p.n, color: p.color }))}>
        <span className="text-[42px] leading-none tracking-[-0.04em]">{total}</span>
        <span className="mt-1 text-xs text-on-brand-muted">{unit}</span>
      </Ring>
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-page">{title}</h1>
            <p className="text-[13px] text-on-brand-muted">{sub}</p>
          </div>
          <Link id="hero-alerts-label"
            to={ROUTES.alerts}
            aria-label={t('shared.overview.hero.alertsLabel', { n: unread })}
            title={t('shared.overview.hero.unreadTitle', { n: unread })}
            className="v-hero__alerts-label relative grid size-11 shrink-0 place-items-center rounded-full bg-white/16 transition hover:bg-white/26 focus-visible:outline-white"
          >
            <Icon name="bell" className="size-4.5" strokeWidth={1.8} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -end-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-warn px-1.5 text-[11px] ring-2 ring-brand-700">{unread}</span>
            )}
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-3">
          {parts.filter((p) => p.tile !== false).map((p, i) => (
            <Link id={`hero-link-1-${p.key}`}
              key={p.key}
              to={p.to}
              style={{ animationDelay: `${0.25 + i * 0.06}s` }}
              className="v-hero__link-1 flex animate-rise flex-col gap-1 rounded-[18px] bg-white/12 px-4 py-3 transition hover:bg-white/20 focus-visible:outline-white"
            >
              <span className="flex items-center gap-2 text-[13px] whitespace-nowrap text-on-brand-soft">
                <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} />
                {p.label}
              </span>
              <span className="text-[26px] tracking-[-0.03em]">{p.n}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
