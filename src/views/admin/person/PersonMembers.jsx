import { Link } from 'react-router-dom'
import { Card, cx, Icon, MemberAvatar, StepBadge } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { formatShort } from '../../../models/rules/format.js'
import { memberPath } from '../../../routes/paths.js'

/** Who the person is working with now, soonest session first, and how many places are left. */
export function PersonMembers({ person, open, load }) {
  const { label, settings } = useConfig()
  const { t } = useLang()
  const first = person.name.split(' ')[0]
  const sorted = [...open].sort((a, b) => (a.session?.at ?? Infinity) - (b.session?.at ?? Infinity))
  const cap = settings.maxOpenMembers
  const showCap = load != null && load < cap

  return (
    <Card id="person-members-title" as="section" padding="none" className="flex min-w-0 flex-[1.6_1_560px] animate-rise flex-col gap-3.5 px-6 pt-6 pb-4.5 [animation-delay:.3s]">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-h2 text-ink">{t('admin.person.members.title', { name: first })}</h2>
        <p className="text-[13px] text-muted">{t('admin.person.members.sub', { name: first })}</p>
      </div>
      <div className="flex flex-col">
        {sorted.map((m, i) => (
          <Link id={`person-members-member-${m.id}`}
            key={m.id}
            to={memberPath(m.code)}
            className={cx('v-person-members__member', '-mx-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-ink transition-colors hover:bg-wash', i > 0 && 'border-t border-line')}
          >
            <MemberAvatar name={m.name} size="size-10 rounded-[13px] text-[13px]" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{m.name}</span>
              <span className="truncate text-xs text-muted">
                {m.company}
                {m.plan && ` · ${label('business_type', m.plan)}`}
              </span>
            </span>
            <StepBadge member={m} />
            <span className="w-34 shrink-0 text-[13px] whitespace-nowrap">{m.session ? `${formatShort(m.session.date)} · ${m.session.time}` : <span className="text-faint">{t('admin.person.members.notBooked')}</span>}</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-soft">
              <Icon name="chevronRight" className="size-3.75" strokeWidth={2} />
            </span>
          </Link>
        ))}
        {sorted.length === 0 && <p className="py-6 text-sm text-muted">{t('admin.person.members.nothing', { name: first })}</p>}
      </div>
      {showCap && (
        <div className="mt-1.5 flex min-h-40 flex-1 flex-col items-center justify-center gap-3.5 rounded-3xl border-[1.5px] border-dashed border-brand-dash bg-linear-to-b from-brand-wash-2 to-surface-2 p-6 text-center">
          <div className="flex items-center">
            {Array.from({ length: cap }, (_, i) => (
              <span
                key={i}
                className={cx(
                  'size-8 rounded-full ring-3 ring-surface-2',
                  i > 0 && '-ms-2',
                  i < load ? 'bg-brand-700' : 'bg-panel bg-[repeating-linear-gradient(135deg,transparent_0_5px,var(--color-brand-stripe)_5px_7px)] shadow-[inset_0_0_0_1.5px_var(--color-brand-load-ring)]',
                )}
              />
            ))}
          </div>
          <span className="flex flex-col gap-1">
            <span className="text-sm text-ink">
              {t('admin.person.members.placesFree', { free: cap - load, cap })}
            </span>
            <span className="max-w-95 text-[13px] leading-[1.55] text-muted">
              {t(person.role === 'onboarding' ? 'admin.person.members.autoOnboarding' : 'admin.person.members.autoRoom', { name: first })}
            </span>
          </span>
        </div>
      )}
    </Card>
  )
}
