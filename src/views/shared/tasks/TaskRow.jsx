import { Badge, cx, ListRow, MemberAvatar, RowArrow, StepBadge, TONES } from '@/components'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { formatShort, fromDay } from '../../../models/rules/format.js'
import { memberPath } from '../../../routes/paths.js'

/** The list's columns, shared by the heading row and every task row. */
export const COLUMNS = 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_160px_150px_36px] items-center gap-6 px-4'

/** One thing to do: the member, what to do, when it's due, its step. The row opens the member on that step's tab. */
export function TaskRow({ task: t, today, index }) {
  const { t: say } = useLang()
  const { member: m } = t
  const late = t.due && t.due < today
  const due = !t.due
    ? [say('shared.tasks.due.none'), 'neutral']
    : late
      ? [say('shared.tasks.due.late', { date: formatShort(fromDay(t.due)) }), 'danger']
      : t.due === today ? [say('shared.tasks.due.today'), 'warn'] : [formatShort(fromDay(t.due)), 'brand']

  return (
    <ListRow id={`task-row-${m.code}-${t.step}`} to={`${memberPath(m.code)}?tab=${t.tab}${t.at ? `#${t.at}` : ''}`} columns={COLUMNS} index={index} className="v-tasks__row py-3">
      <span className="flex min-w-0 items-center gap-3.5">
        <MemberAvatar name={m.name} size="size-10 rounded-[13px] text-[13px]" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{m.name}</span>
          <span className="truncate text-xs text-muted">{m.company}</span>
        </span>
      </span>
      <span className={cx('line-clamp-2 text-sm', late ? TONES.danger.text : 'text-ink')}>{t.todo}</span>
      <span>
        <Badge size="row" tone={due[1]}>{due[0]}</Badge>
      </span>
      <span>
        <StepBadge step={t.step} />
      </span>
      <RowArrow />
    </ListRow>
  )
}
