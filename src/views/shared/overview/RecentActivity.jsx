import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { Card, cx } from '../../../components/ui/index.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { ago } from '../../../models/rules/format.js'
import { pick } from '../../../content/index.js'
import { ROUTES, memberPath } from '../../../routes/paths.js'
import { TONES } from '../../../components/tones.js'

const LOOK = {
  document_uploaded: ['file', 'success'],
  document_removed: ['file', 'neutral'],
  session: ['calendar', 'brand'],
  no_show: ['calendar', 'warn'],
  transferred: ['arrowUpRight', 'indigo'],
  handed_over: ['arrowUpRight', 'indigo'],
  setup_done: ['check', 'success'],
  completed: ['checkCircle', 'success'],
  closed: ['checkCircle', 'success'],
  note: ['bubble', 'warn'],
  account: ['shield', 'brand'],
  account_created: ['shield', 'success'],
  customer_signed_in: ['user', 'success'],
  sent_back: ['refresh', 'warn'],
  rating: ['star', 'success'],
  recording: ['video', 'warn'],
  recording_sent: ['video', 'success'],
  integration: ['link', 'indigo'],
  connected: ['link', 'success'],
  tested: ['check', 'success'],
}

/**
 * This week on this person's members: `counters` ([label, test(line)]) counted, then the latest
 * lines (in the reader's language), each opening its member. `sub` replaces the "N things happened" line.
 */
export function RecentActivity({ lines, members, counters, sub }) {
  const { t, lang } = useLang()
  const byId = new Map(members.map((m) => [m.id, m]))

  return (
    <Card as="section" radius="rounded-tile" padding="none" className="flex animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.55s]">
      <div className="flex flex-col gap-4 rounded-3xl bg-brand-700 px-5.5 py-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-h2">{t('overview.activity.title')}</h2>
            <span className="text-[13px] text-[#cfe5e4]">
              {sub ?? (lines.length ? t('overview.activity.happened', { n: lines.length }) : t('overview.activity.nothing'))}
            </span>
          </div>
          <Link to={ROUTES.alerts} className="inline-flex h-9.5 items-center gap-1.5 rounded-full bg-white/16 px-3.5 text-[13px] text-white transition hover:bg-white/26 hover:text-white">
            {t('overview.links.alerts')}
            <Icon name="arrowUpRight" className="size-3" strokeWidth={1.8} />
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2">
          {counters.map(([label, test]) => (
            <span key={label} className="flex flex-col items-center gap-0.5 rounded-2xl bg-white/12 px-2.5 py-2.5">
              <span className="text-2xl leading-none tracking-[-0.03em] tabular-nums">{lines.filter(test).length}</span>
              <span className="text-xs text-[#cfe5e4]">{label}</span>
            </span>
          ))}
        </div>
      </div>
      {lines.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          {lines.slice(0, 8).map((l, i) => {
            const m = byId.get(l.memberId)
            const [icon, tone] = LOOK[l.kind] ?? (l.kind.startsWith('person_') ? ['userPlus', 'indigo'] : ['info', 'neutral'])
            return (
              <Link
                key={l.id}
                to={m ? memberPath(m.code) : ROUTES.members}
                style={{ animationDelay: `${0.65 + i * 0.05}s` }}
                className="flex animate-rise items-center gap-3 rounded-[18px] bg-surface-2 p-3 text-ink transition hover:-translate-y-0.5 hover:bg-surface"
              >
                <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl', TONES[tone].fill, TONES[tone].text)}>
                  <Icon name={icon} className="size-3.75" strokeWidth={1.8} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">
                    <span className="font-medium">{m?.name.split(' ')[0] ?? t('overview.aMember')}</span> · {pick(lang, l.text, l.textAr)}
                  </span>
                  <span className="text-xs text-muted">{ago(l.at)}</span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
