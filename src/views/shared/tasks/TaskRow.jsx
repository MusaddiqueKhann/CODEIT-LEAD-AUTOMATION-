import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { MemberAvatar, StepBadge } from '../../../components/shared/index.js'
import { cx } from '../../../components/ui/index.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { formatShort, fromDay } from '../../../models/rules/format.js'
import { memberPath } from '../../../routes/paths.js'
import { TONES } from '../../../components/tones.js'

/** The list's columns, shared by the heading row and every task row. */
export const COLUMNS = 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_160px_150px_36px] items-center gap-6 px-4'

/** One thing to do: the member, what to do, when it's due, its step. The row opens the member on that step's tab. */
export function TaskRow({ task: t, today, index }) {
  const { t: say } = useLang()
  const { member: m } = t
  const late = t.due && t.due < today
  const due = !t.due
    ? [say('tasks.due.none'), 'neutral']
    : late
      ? [say('tasks.due.late', { date: formatShort(fromDay(t.due)) }), 'danger']
      : t.due === today ? [say('tasks.due.today'), 'warn'] : [formatShort(fromDay(t.due)), 'brand']

  return (
    <Link
      to={`${memberPath(m.code)}?tab=${t.tab}${t.at ? `#${t.at}` : ''}`}
      style={{ animationDelay: `${0.12 + index * 0.04}s` }}
      className={cx(COLUMNS, 'mx-3 animate-rise py-3 text-ink transition-colors hover:bg-wash', index > 0 && 'border-t border-line')}
    >
      <span className="flex min-w-0 items-center gap-3.5">
        <MemberAvatar name={m.name} size="size-10 rounded-[13px] text-[13px]" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{m.name}</span>
          <span className="truncate text-xs text-muted">{m.company}</span>
        </span>
      </span>
      <span className={cx('line-clamp-2 text-sm', late ? TONES.danger.text : 'text-ink')}>{t.todo}</span>
      <span>
        <span className={cx('inline-flex h-7 items-center rounded-full px-3 text-xs whitespace-nowrap', TONES[due[1]].fill, TONES[due[1]].text)}>{due[0]}</span>
      </span>
      <span>
        <StepBadge step={t.step} />
      </span>
      <span className="grid size-9 place-items-center rounded-xl bg-surface text-soft">
        <Icon name="chevronRight" className="size-3.5" strokeWidth={2} />
      </span>
    </Link>
  )
}
