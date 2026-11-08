import { Link } from 'react-router-dom'
import { StepBadge } from '../../../components/shared/index.js'
import { cx } from '../../../components/ui/index.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { weekdayNames } from '../../../models/rules/format.js'
import { memberPath } from '../../../routes/paths.js'
import { SessionAvatar } from './SessionAvatar.jsx'

/**
 * The other steps' work, a column per day: who is on leave, then each thing due that day (the
 * member, what is due, its step and whose it is). Tasks are { id, code, title, what, step, personId }.
 */
export function TaskBoard({ days, today, tasksOn, leaveOn }) {
  const { t } = useLang()
  return (
    <div className={cx('flex h-full flex-col p-4.5', days.length > 1 && 'min-w-225')}>
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-3" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((d, di) => {
          const isToday = +d === +today
          const tasks = tasksOn(d)
          const away = leaveOn(d)
          return (
            <div key={+d} className="flex min-h-0 min-w-0 flex-col gap-3">
              <div className="flex items-center gap-3 px-1">
                <span className={cx('grid size-10 shrink-0 place-items-center rounded-[14px] text-base', isToday ? 'bg-brand-700 text-white' : 'bg-surface text-ink')}>{d.getDate()}</span>
                <span className="flex flex-col">
                  <span className="text-[11px] tracking-[0.1em] text-faint uppercase">{weekdayNames()[d.getDay()]}</span>
                  <span className="text-xs text-soft">{t('calendar.tasks', { n: tasks.length })}</span>
                </span>
              </div>
              <div className={cx('scrollbar-slim flex min-h-40 flex-1 flex-col gap-2.5 overflow-y-auto rounded-[22px] p-3', isToday ? 'bg-brand-50' : 'bg-surface-2')}>
                {away.map((l) => (
                  <span key={l.id} className="flex h-7.5 shrink-0 items-center truncate rounded-[10px] bg-panel px-2.5 text-xs text-soft">
                    {t('calendar.onLeave', { name: l.title })}
                  </span>
                ))}
                {tasks.map((task, ti) => (
                  <Link
                    key={task.id}
                    to={task.code ? memberPath(task.code) : '#'}
                    style={{ animationDelay: `${0.15 + di * 0.04 + ti * 0.04}s` }}
                    className="flex shrink-0 animate-rise flex-col gap-2 rounded-2xl bg-panel px-3.5 py-3 text-ink shadow-[0_8px_20px_-14px_rgb(30_50_80/0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_26px_-16px_rgb(30_50_80/0.35)]"
                  >
                    <span className="truncate text-sm font-medium">{task.title}</span>
                    <span className="text-[13px] leading-snug text-muted">{task.what}</span>
                    <span className="flex items-center justify-between gap-2">
                      <StepBadge step={task.step} className="h-6 px-2.5 text-[11px]" />
                      <SessionAvatar item={task} className="size-6.5 text-[10px]" />
                    </span>
                  </Link>
                ))}
                {tasks.length === 0 && away.length === 0 && <span className="m-auto text-[13px] text-ghost">{t('calendar.nothingDue')}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
