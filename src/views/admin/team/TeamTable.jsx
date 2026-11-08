import { Avatar, cx, Icon, ListHead, ListRow, TONES } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { personPath } from '../../../routes/paths.js'
import { initials } from '../../../models/rules/time.js'
import { personStatus } from '../../../models/rules/personStatus.js'

const COLUMNS = 'grid grid-cols-[minmax(240px,1fr)_200px_220px_40px] items-center gap-6 px-4'

/** The team, one row each: who, their role and where they are. A row opens their page. */
export function TeamTable({ people }) {
  const { label } = useConfig()
  const { t } = useLang()

  return (
    <div className="min-w-190">
      <div className="sticky top-0 z-2 bg-panel px-3 pt-3 pb-1.5">
        <ListHead columns={COLUMNS}>
          <span className="ps-14">{t('admin.team.columns.person')}</span>
          <span>{t('admin.team.columns.role')}</span>
          <span>{t('admin.team.columns.status')}</span>
          <span />
        </ListHead>
      </div>
      {people.map((p, i) => {
        const [text, tone] = personStatus(p, t)
        return (
          <ListRow id={`team-table-person-${p.id}`} key={p.id} to={personPath(p.id)} columns={COLUMNS} index={i} className={cx('v-team__row py-3.5', !p.active && 'opacity-60')}>
            <span className="flex min-w-0 items-center gap-3.5">
              <Avatar initials={initials(p.name)} size="md" className="size-10.5 text-[13px]" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[15px] font-medium">{p.name}</span>
                <span className="truncate text-[13px] text-muted" dir="ltr">
                  {p.email}
                </span>
              </span>
            </span>
            <span className="truncate text-sm">{label('role', p.role)}</span>
            <span>
              <span className={cx('inline-flex h-8 w-55 items-center justify-center rounded-full px-3.5 text-[13px] whitespace-nowrap', TONES[tone].fill, TONES[tone].text)}>
                {text}
              </span>
            </span>
            <span className="grid size-10 place-items-center rounded-[14px] bg-surface text-soft">
              <Icon name="chevronRight" className="size-4" strokeWidth={2} />
            </span>
          </ListRow>
        )
      })}
    </div>
  )
}
