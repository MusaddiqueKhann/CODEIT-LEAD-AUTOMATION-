import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { weekdayNames, formatStamp, fromDay, fromServer, riyadhNow, startOfDay } from '../../../models/rules/format.js'
import { STEP_ROLE } from '../../../models/rules/stages.js'
import { addDays } from '../../../models/rules/time.js'
import { cx } from '../../../components/ui/index.js'
import { Panel } from './Panel.jsx'

const DAY = 864e5
const NOW_BAR = 'bg-[repeating-linear-gradient(90deg,#367b7f_0_3px,#3f8a8e_3px_6px)] rtl:bg-[repeating-linear-gradient(270deg,#367b7f_0_3px,#3f8a8e_3px_6px)]'

/**
 * When each step ran, as bars over the days: done ones pale, the current one striped, the next
 * one waiting with its due day. The moves come from the activity log (Transfer, Handed to
 * Onboarding); the rest from the member's own dates.
 */
export function JourneyCard({ member: m, lines }) {
  const { label, person, brand } = useConfig()
  const { t, dir } = useLang()
  const now = riyadhNow()
  const last = (kind) => (lines ?? []).find((l) => l.kind === kind)?.at
  const collecting = m.stage === 'collecting'
  const transferAt = collecting ? null : last('transferred')
  const handoverAt = m.integrations.length ? last('handed_over') : transferAt
  const onboardingNow = ['setup', 'session', 'recording'].includes(m.stage)
  const closedAt = m.stage === 'closed' ? fromServer(m.holderSince) : null
  const account = m.accountCreatedAt && fromServer(m.accountCreatedAt)

  const rows = [
    { step: 'sales', from: m.createdAt, to: transferAt ?? now, state: collecting ? 'now' : 'done', due: collecting && m.transferDeadline },
    { step: 'setup', from: m.createdAt, to: account ?? now, state: account ? 'done' : collecting ? 'now' : 'next' },
    m.integrations.length > 0 && {
      step: 'integration',
      from: transferAt,
      to: m.stage === 'integration' ? now : handoverAt,
      state: m.stage === 'integration' ? 'now' : collecting ? 'next' : 'done',
      due: m.stage !== 'closed' && !onboardingNow && m.integrationDue,
    },
    {
      step: 'onboarding',
      from: handoverAt,
      to: closedAt ?? now,
      state: onboardingNow ? 'now' : closedAt ? 'done' : 'next',
      due: !closedAt && m.setupDue,
    },
  ].filter(Boolean)
  if (m.outcome) rows.forEach((r) => r.state === 'now' && (r.state = 'done'))

  // The days across the top: from the day it was added, at least six, at most fourteen.
  const dues = rows.map((r) => r.due && fromDay(r.due)).filter(Boolean)
  const end = startOfDay(new Date(Math.max(+now, ...dues.map(Number))))
  let start = startOfDay(m.createdAt)
  const span = Math.round((end - start) / DAY) + 1
  if (span > 14) start = addDays(end, -13)
  const cols = Math.min(14, Math.max(6, span))
  const days = Array.from({ length: cols }, (_, i) => addDays(start, i))
  const pct = (at) => `${Math.min(100, Math.max(0, ((at - start) / (cols * DAY)) * 100))}%`
  const dueDay = rows.find((r) => r.state === 'now' && r.due)?.due
  // The day lines run from the row's start: the right in Arabic.
  const track = `repeating-linear-gradient(${dir === 'rtl' ? 270 : 90}deg, #f1f4f7 0 calc(${100 / cols}% - 1px), #e6e9ef calc(${100 / cols}% - 1px) ${100 / cols}%)`

  return (
    <Panel title={t('member.journey.title')} sub={t('member.journey.sub')} className="flex-[1.6_1_520px]">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[130px_minmax(0,1fr)] text-[11px] text-faint">
          <span />
          <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {days.map((d) => (
              <span key={+d} className={cx('truncate', dueDay && +d === +fromDay(dueDay) && 'text-warn-ink')}>
                {weekdayNames()[d.getDay()]} {d.getDate()}
              </span>
            ))}
          </div>
        </div>
        {rows.map((r, i) => {
          const who = person(m.people[STEP_ROLE[r.step]])
          return (
            <div key={r.step} className="grid grid-cols-[130px_minmax(0,1fr)] items-center">
              <span className="flex min-w-0 flex-col">
                <span className={cx('text-sm', r.state === 'next' ? 'text-soft' : 'text-ink')}>{label('step', r.step)}</span>
                <span className="truncate text-[11px] text-faint">{who?.name ?? (r.state === 'next' ? t('member.journey.notPicked') : brand.app)}</span>
              </span>
              <div className="relative h-5.5 rounded-full" style={{ background: track }}>
                {r.state !== 'next' && r.from && (
                  <span
                    style={{ insetInlineStart: pct(r.from), width: `max(calc(${pct(r.to)} - ${pct(r.from)}), 22px)`, animationDelay: `${0.5 + i * 0.12}s` }}
                    className={cx('absolute inset-y-0 origin-left animate-rise rounded-full rtl:origin-right', r.state === 'now' ? NOW_BAR : 'bg-brand-300')}
                  />
                )}
                {r.state === 'next' && r.due && (
                  <span className="absolute top-0.75 flex h-4 items-center rounded-full bg-warn-bg px-1.5 text-[10px] text-warn-ink" style={{ insetInlineStart: `min(${pct(fromDay(r.due))}, calc(100% - 34px))` }}>
                    {t('member.journey.due')}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <span className="text-xs text-faint">{t('member.journey.today', { at: formatStamp(now) })}</span>
      </div>
    </Panel>
  )
}
