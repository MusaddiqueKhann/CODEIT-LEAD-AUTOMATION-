import { Avatar, cx, ListRow, MemberAvatar, RowArrow, StepBadge } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { nobodyLabel } from '../../../models/rules/members.js'
import { memberPath } from '../../../routes/paths.js'
import { initials } from '../../../models/rules/time.js'

/** The list's columns, shared by the heading row and every member row. */
export const COLUMNS = 'grid grid-cols-[minmax(0,1fr)_150px_210px_36px] items-center gap-6 px-4'

/** One member: who, which step, who has it now. The whole row opens the member. */
export function MemberRow({ member: m, index }) {
  const { label, person } = useConfig()
  const { t } = useLang()
  const holder = person(m.holderId)

  return (
    <ListRow id={`member-row-${m.code}`} to={memberPath(m.code)} columns={COLUMNS} index={index} className="v-members__row py-3">
      <span className="flex min-w-0 items-center gap-3.5">
        <MemberAvatar name={m.name} size="size-10 rounded-[13px] text-[13px]" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{m.name}</span>
          <span className="truncate text-xs text-muted">
            {m.company}
            {m.plan && ` · ${label('business_type', m.plan)}`}
          </span>
        </span>
      </span>
      <span>
        <StepBadge member={m} />
      </span>
      <span className="flex min-w-0 items-center gap-2.5">
        {holder && <Avatar initials={initials(holder.name)} size="sm" className="size-8.5 text-[11px]" />}
        <span className={cx('truncate text-sm', holder ? 'text-ink' : 'text-faint')}>{holder?.name ?? nobodyLabel(m, t)}</span>
      </span>
      <RowArrow />
    </ListRow>
  )
}
