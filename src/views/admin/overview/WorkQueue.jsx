import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { Card, cx } from '../../../components/ui/index.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { initials } from '../../../models/rules/time.js'

/**
 * Everything waiting on someone, grouped by step: a count, the first few faces (amber when it is
 * urgent), and what it is. `groups` are [{ title, items: [{ key, label, icon, to, people: [{ name,
 * urgent }] }] }].
 */
export function WorkQueue({ groups }) {
  const { t } = useLang()
  const all = groups.flatMap((g) => g.items.flatMap((i) => i.people))
  const urgent = all.filter((p) => p.urgent).length

  return (
    <Card as="section" radius="rounded-tile" padding="none" className="flex animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.28s]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-baseline gap-2.5">
          <h2 className="text-h2 text-ink">{t('overview.queue.title')}</h2>
          <span className="text-[13px] text-muted">{t('overview.queue.count', { all: all.length, urgent })}</span>
        </span>
        <span className="flex gap-3.5 text-xs text-soft">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-warn" />
            {t('overview.queue.urgent')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-brand-700" />
            {t('overview.queue.onTrack')}
          </span>
        </span>
      </div>
      <div className="scrollbar-slim flex items-stretch gap-3 overflow-x-auto">
        {groups.map((g) => (
          <div
            key={g.title}
            style={{ flex: `${g.items.length} 0 ${g.items.length * 84 + 28}px` }}
            className="flex flex-col gap-3 rounded-[20px] bg-surface-2 px-3.5 pt-4 pb-3"
          >
            <span className="text-[13px] text-soft">{g.title}</span>
            <div className="grid flex-1 items-end gap-3" style={{ gridTemplateColumns: `repeat(${g.items.length}, minmax(0, 1fr))` }}>
              {g.items.map((item, i) => {
                const hot = item.people.some((p) => p.urgent)
                const shown = [...item.people].sort((a, b) => b.urgent - a.urgent).slice(0, 3)
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    title={`${item.label} · ${item.people.map((p) => p.name).join(t('overview.sep')) || t('overview.queue.none')}`}
                    className="flex h-full flex-col items-center justify-end gap-2 text-ink transition hover:-translate-y-0.75"
                  >
                    <span className="text-[15px]">{item.people.length}</span>
                    <span
                      style={{ animationDelay: `${0.35 + i * 0.06}s` }}
                      className="flex w-12 animate-rise flex-col items-center gap-1.5 rounded-[18px] bg-panel py-1.5"
                    >
                      {shown.length === 0 ? (
                        <span className="grid size-9 place-items-center rounded-full text-success-ink">
                          <Icon name="check" className="size-4" strokeWidth={2.4} />
                        </span>
                      ) : (
                        shown.map((p, n) => (
                          <span
                            key={`${p.name}:${n}`}
                            className={cx('grid size-9 place-items-center rounded-full text-[10px] text-white ring-2 ring-white', p.urgent ? 'bg-warn' : 'bg-brand-900')}
                          >
                            {initials(p.name)}
                          </span>
                        ))
                      )}
                      {item.people.length > 3 && <span className="text-[10px] text-muted">+{item.people.length - 3}</span>}
                    </span>
                    <span className={cx('grid size-9 place-items-center rounded-xl bg-panel', hot ? 'text-warn-ink' : 'text-brand-700')}>
                      <Icon name={item.icon} className="size-4" strokeWidth={1.8} />
                    </span>
                    <span className="text-center text-[11px] leading-tight text-muted">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
