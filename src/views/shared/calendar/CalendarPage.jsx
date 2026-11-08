import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, PageHeader, Select, Tabs } from '@/components'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useCalendar } from '../../../controllers/shared/useCalendar.js'
import { weekdayNames, dayKey, isSameDay, monthShort, monthYear, riyadhNow, startOfDay } from '../../../models/rules/format.js'
import { stepOfStage } from '../../../models/rules/stages.js'
import { addDays, byDateTime, hourSpan, startOfWeek, toMinutes } from '../../../models/rules/time.js'
import { range, timeSpan } from './grid.js'
import { MonthGrid } from './MonthGrid.jsx'
import { SessionsDialog } from './SessionsDialog.jsx'
import { TaskBoard } from './TaskBoard.jsx'
import { TimeGrid } from './TimeGrid.jsx'

const VIEWS = ['day', 'week', 'month']
const MODES = ['sessions', 'other']
/** Each due date the server sends, as the step it belongs to and its words (shared.calendar.due.*; files name themselves). */
const TASKS = {
  transfer_due: ['sales', 'transfer'],
  files_due: ['sales', null],
  hardware_due: ['sales', 'hardware'],
  account_due: ['setup', 'account'], // says the product's name (Settings → Company)
  integration_due: ['integration', 'integration'],
}
const OTHER_STEPS = ['sales', 'setup', 'integration']

/**
 * The calendar in two modes: the Onboarding sessions by time, or the other steps' (Sales, Setup,
 * Integration) due dates as a board, each by day, week or month. The mode, step and whose sessions
 * are in the address (?mode=other&step=sales, ?who=all), so the sidebar opens it filtered. Sessions
 * are your members' unless ?who=all (the Admin always sees all); due dates are always your own.
 */
export function CalendarPage() {
  const { role } = useAuth()
  const { settings, label, meta, brand } = useConfig()
  const { t } = useLang()
  const today = startOfDay(riyadhNow())
  const [params, setParams] = useSearchParams()
  const mode = params.get('mode') === 'other' ? 'other' : 'sessions'
  const step = OTHER_STEPS.includes(params.get('step')) ? params.get('step') : ''
  const everyone = role === 'admin' || params.get('who') === 'all'
  const setAddress = (next) => setParams(Object.fromEntries(Object.entries({ mode, step, who: params.get('who') ?? '', ...next }).filter(([, v]) => v && v !== 'sessions')), { replace: true })
  const [view, setView] = useState('week')
  const [anchor, setAnchor] = useState(today)
  const [pop, setPop] = useState(null) // { day, time? }

  // The days on screen, and so the range to load. Weeks show the working days only.
  const weekStart = startOfWeek(anchor)
  const workDays = settings.officeHours.flatMap((h, i) => (h.on ? [i] : []))
  const week = range(0, 7).map((i) => addDays(weekStart, i)).filter((d) => workDays.includes(d.getDay()))
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const weeks = Math.ceil((firstOfMonth.getDay() + new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()) / 7)
  const cells = range(0, weeks * 7).map((i) => addDays(firstOfMonth, i - firstOfMonth.getDay()))
  const [from, to] = view === 'day' ? [anchor, anchor] : view === 'week' ? [weekStart, addDays(weekStart, 6)] : [cells[0], cells.at(-1)]
  const { data } = useCalendar(dayKey(from), dayKey(to), everyone)
  const items = data ?? []

  const sessions = items.filter((i) => i.kind === 'session').map((i) => ({ ...i, step: stepOfStage(i.status), right: timeSpan(i) }))
  // A member's files due the same day make one task.
  const tasks = []
  for (const i of items.filter((x) => TASKS[x.kind])) {
    const same = i.kind === 'files_due' && tasks.find((t) => t.kind === 'files_due' && t.memberId === i.memberId && +t.date === +i.date)
    if (same) same.files.push(i.detail)
    else tasks.push({ ...i, step: TASKS[i.kind][0], files: [i.detail] })
  }
  for (const task of tasks) {
    task.what = task.kind === 'files_due'
      ? task.files.length === 1
        ? t('shared.calendar.due.file', { file: label('document', task.files[0]) })
        : t('shared.calendar.due.files', { n: task.files.length, list: task.files.map((k) => meta('document', k, 'short') || label('document', k)).join(t('shared.common.listJoin')) })
      : t(`shared.calendar.due.${TASKS[task.kind][1]}`, { product: brand.product })
    task.right = task.what
  }
  const shownTasks = tasks.filter((t) => !step || t.step === step)

  const sessionsOn = (d) => sessions.filter((i) => isSameDay(i.date, d)).sort(byDateTime)
  const tasksOn = (d) => shownTasks.filter((i) => isSameDay(i.date, d))
  const leaveOn = (d) => items.filter((i) => i.kind === 'leave' && i.date <= d && d <= i.endsDate)
  const itemsOn = mode === 'sessions' ? sessionsOn : tasksOn
  /** "3 sessions" / "3 tasks", whichever this mode shows. */
  const count = (n) => t(mode === 'sessions' ? 'shared.calendar.sessions' : 'shared.calendar.tasks', { n })

  const days = view === 'day' ? [anchor] : week
  // Office hours set the grid, widened to the hour of any session outside them.
  const [first, last] = hourSpan(settings.officeHours)
  const timed = days.flatMap(sessionsOn)
  const hours = [
    Math.min(first, ...timed.map((i) => Math.floor(toMinutes(i.time) / 60))),
    Math.max(last, ...timed.map((i) => Math.ceil((toMinutes(i.time) + i.minutes) / 60))),
  ]

  const move = (dir) =>
    setAnchor((d) => (view === 'month' ? new Date(d.getFullYear(), d.getMonth() + dir, 1) : addDays(d, dir * (view === 'week' ? 7 : 1))))

  const riyadh = mode === 'sessions' ? t('shared.calendar.riyadh') : ''
  const inMonth = (mode === 'sessions' ? sessions : shownTasks).filter((i) => i.date.getMonth() === anchor.getMonth()).length
  const dayMonth = (d) => t('shared.calendar.dayMonth', { month: monthShort(d), day: d.getDate() })
  const sub =
    view === 'month'
      ? `${t('shared.calendar.thisMonth', { count: count(inMonth) })}${riyadh}`
      : `${view === 'day' ? dayMonth(anchor) : week.length ? `${dayMonth(week[0])} – ${dayMonth(week.at(-1))}` : ''} · ${count(days.flatMap(itemsOn).length)}${riyadh}`

  const popItems = pop ? itemsOn(pop.day).filter((i) => !pop.time || i.time === pop.time) : []
  const popDay = pop && `${weekdayNames('long')[pop.day.getDay()]} ${pop.day.getDate()} ${monthShort(pop.day)}`

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-2rem)]">
      <PageHeader
        title={monthYear(anchor)}
        sub={sub}
        nav={{ onPrev: () => move(-1), onNext: () => move(1) }}
        actions={
          <>
            <Tabs id="calendar-page-modes"
              size="sm"
              items={MODES.map((key) => ({ key, label: t(`shared.calendar.modes.${key}`) }))}
              value={mode}
              onChange={(m) => {
                setAddress({ mode: m, step: '' })
                setPop(null)
              }}
            />
            {mode === 'other' && (
              <Select id="calendar-page-step" pill aria-label={t('shared.calendar.step')} value={step} onChange={(e) => setAddress({ step: e.target.value })} className="ps-4 pe-10">
                <option value="">{t('shared.calendar.everyStep')}</option>
                {OTHER_STEPS.map((s) => (
                  <option key={s} value={s}>
                    {label('step', s)}
                  </option>
                ))}
              </Select>
            )}
            <Tabs id="calendar-page-set-view" size="sm" items={VIEWS.map((key) => ({ key, label: t(`shared.calendar.views.${key}`) }))} value={view} onChange={setView} />
          </>
        }
      />

      <Card padding="none" clip className="flex min-h-120 animate-rise flex-col [animation-delay:.08s] lg:min-h-0 lg:flex-1">
        <div className="scrollbar-slim min-h-0 flex-1 overflow-auto">
          {!data ? (
            <p className="px-6 py-12 text-center text-sm text-muted">{t('shared.calendar.loading')}</p>
          ) : view === 'month' ? (
            <MonthGrid
              anchor={anchor}
              cells={cells}
              today={today}
              itemsOn={itemsOn}
              count={count}
              chip={(i) => (mode === 'sessions' ? `${i.time} ${i.title.split(' ')[0]}` : `${i.title.split(' ')[0]} · ${label('step', i.step)}`)}
              onDay={(day) => setPop({ day })}
            />
          ) : mode === 'sessions' ? (
            <TimeGrid days={days} today={today} hours={hours} sessionsOn={sessionsOn} onGroup={(day, time) => setPop({ day, time })} />
          ) : (
            <TaskBoard days={days} today={today} tasksOn={tasksOn} leaveOn={leaveOn} />
          )}
        </div>
      </Card>

      <SessionsDialog
        open={popItems.length > 0}
        onClose={() => setPop(null)}
        title={pop?.time ? t('shared.calendar.at', { count: count(popItems.length), time: pop.time }) : popDay}
        sub={pop?.time ? `${popDay}${riyadh}` : `${count(popItems.length)}${riyadh}`}
        items={popItems}
        onDayView={
          pop && !pop.time
            ? () => {
                setAnchor(pop.day)
                setView('day')
                setPop(null)
              }
            : null
        }
        onWeekView={() => {
          setAnchor(pop.day)
          setView('week')
          setPop(null)
        }}
      />
    </div>
  )
}
