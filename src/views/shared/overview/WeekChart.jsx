import { Card, cx } from '@/components'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { riyadhNow, startOfDay } from '../../../models/rules/format.js'
import { addDays, startOfWeek } from '../../../models/rules/time.js'
import { CardHead } from './CardHead.jsx'

/** "W45": the week of the year a Sunday-to-Saturday week starts in. */
const weekNo = (d) => {
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - jan1) / 864e5 + jan1.getDay() + 1) / 7)
}

/** How many of `dates` fall in each of the last six weeks, as bars (this week in teal). */
export function WeekChart({ title, sub, dates }) {
  const { t } = useLang()
  const today = startOfDay(riyadhNow())
  const thisWeek = startOfWeek(today)
  const weeks = Array.from({ length: 6 }, (_, i) => addDays(thisWeek, (i - 5) * 7)).map((start, i) => ({
    start,
    now: i === 5,
    n: dates.filter((d) => d >= start && d < addDays(start, 7)).length,
  }))
  const most = Math.max(1, ...weeks.map((w) => w.n))

  return (
    <Card radius="rounded-tile" padding="none" className="flex min-w-0 flex-[2_1_340px] animate-rise flex-col gap-4 px-6 py-5 [animation-delay:.5s]">
      <CardHead id="week-chart-head" title={title} sub={sub ?? t('shared.overview.week.last6')} />
      <div className="grid min-h-37.5 flex-1 grid-cols-6 items-stretch gap-2.5">
        {weeks.map((w, i) => (
          <div key={+w.start} className="flex min-h-0 flex-col items-center gap-2">
            <span className="flex w-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[13px] tabular-nums">{w.n}</span>
              <span
                className={cx('w-full max-w-10 origin-bottom animate-grow rounded-xl', w.now ? 'bg-brand-700' : 'bg-brand-bar')}
                style={{ height: `${Math.max(4, (w.n / most) * 80)}%`, animationDelay: `${0.45 + i * 0.05}s` }}
              />
            </span>
            <span className={cx('text-xs whitespace-nowrap', w.now ? 'text-brand-700' : 'text-muted')}>{w.now ? t('shared.overview.week.thisWeek') : t('shared.overview.week.weekNo', { week: weekNo(w.start) })}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
