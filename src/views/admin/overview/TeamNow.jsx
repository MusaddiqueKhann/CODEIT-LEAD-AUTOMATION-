import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { Card, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { ROUTES, personPath } from '../../../routes/paths.js'
import { initials } from '../../../models/rules/time.js'
import { CardHead } from '../../shared/overview/CardHead.jsx'

/**
 * The team as faces sized by how many members each holds, two rows that scroll sideways. An amber
 * ring means full (at the most open members in Settings); grey means away today or not signed in
 * yet. `people` are the team page's rows with `load` (what counts against their places) added.
 */
export function TeamNow({ people }) {
  const { settings } = useConfig()
  const { t } = useLang()
  const cap = settings.maxOpenMembers
  const away = people.filter((p) => p.onLeaveUntil).length
  const strip = useRef(null)
  const [more, setMore] = useState(false)

  // "Scroll for all" only while some faces are out of view.
  useEffect(() => {
    const el = strip.current
    const check = () => setMore(el.scrollWidth > el.clientWidth + 1)
    check()
    const watch = new ResizeObserver(check)
    watch.observe(el)
    return () => watch.disconnect()
  }, [people.length])

  return (
    <Card radius="rounded-tile" padding="none" className="flex min-w-0 animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.34s]">
      <CardHead title={t('overview.team.title')} sub={t('overview.team.sub', { active: people.length - away, away })} to={ROUTES.team} label={t('overview.links.team')} />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div
          ref={strip}
          className={cx(
            'grid snap-x auto-cols-max grid-flow-col grid-rows-[repeat(2,minmax(120px,auto))] items-center justify-items-center gap-x-4.5 gap-y-3.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:none]',
            more && '[mask-image:linear-gradient(90deg,transparent_0,#000_18px,#000_calc(100%-40px),transparent_100%)] rtl:[mask-image:linear-gradient(270deg,transparent_0,#000_18px,#000_calc(100%-40px),transparent_100%)]',
          )}
        >
          {people.map((p) => {
            const grey = p.onLeaveUntil || p.mustChangePassword
            const size = grey ? 40 : 44 + 9 * Math.min(p.openCount, cap)
            const full = !grey && (p.load ?? p.openCount) >= cap
            return (
              <Link key={p.id} to={personPath(p.id)} title={`${p.name.split(' ')[0]} · ${grey ? t(p.onLeaveUntil ? 'overview.team.away' : 'overview.team.new') : t('overview.team.open', { count: p.openCount })}`} className="flex snap-start flex-col items-center gap-1.5 transition hover:-translate-y-0.5">
                <span
                  className={cx('grid place-items-center rounded-full text-white', grey ? 'bg-[#c9ced6]' : 'bg-brand-900', full && 'shadow-[0_0_0_4px_#fff,0_0_0_7px_#e0892b]')}
                  style={{ width: size, height: size, fontSize: grey ? 12 : 12 + Math.min(p.openCount, 5) }}
                >
                  {initials(p.name)}
                </span>
                <span className={cx('text-[11px]', p.onLeaveUntil ? 'text-warn-ink' : 'text-muted')}>{p.onLeaveUntil ? t('overview.team.away') : p.mustChangePassword ? t('overview.team.new') : p.openCount}</span>
              </Link>
            )
          })}
        </div>
        {more && (
          <span className="flex items-center gap-1.5 self-end px-1 pt-1 text-xs text-muted">
            {t('overview.team.scroll', { count: people.length })}
            <Icon name="chevronRight" className="size-3" strokeWidth={2.2} />
          </span>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-4 text-xs text-soft">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full ring-2 ring-warn ring-inset" />
          {t('overview.team.full')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-brand-900" />
          {t('overview.team.size')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-[#c9ced6]" />
          {t('overview.team.awayOrNew')}
        </span>
      </div>
    </Card>
  )
}
