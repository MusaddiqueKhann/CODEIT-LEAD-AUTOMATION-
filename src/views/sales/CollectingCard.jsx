import { Link } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'
import { cx } from '../../components/ui/index.js'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { formatShort, fromDay, riyadhNow, startOfDay } from '../../models/rules/format.js'
import { memberPath } from '../../routes/paths.js'
import { initials } from '../../models/rules/time.js'
import { TONES } from '../../components/tones.js'

/* The 6 ready checks, in the order Sales works through them, with the chip each shows while missing (named in overview.checks). */
const CHECKS = [
  ['details', 'user'],
  ['requirements', 'menu'],
  ['documents', 'file'],
  ['account', 'shield'],
  ['hardware', 'box'],
  ['session', 'video'],
]
const R = 48
const SLOT = (2 * Math.PI * R) / CHECKS.length

/** A member Sales is still collecting for: the checks as a ring round their face, the Transfer deadline, and what's still needed. */
export function CollectingCard({ member: m, index }) {
  const { t } = useLang()
  const ready = m.ready ?? {}
  const missing = CHECKS.filter(([k]) => !ready[k])
  const late = m.late.includes('transfer')
  const left = m.transferDeadline && Math.round((fromDay(m.transferDeadline) - startOfDay(riyadhNow())) / 864e5)
  const due = late
    ? t('overview.collecting.deadlinePassed')
    : m.transferDeadline
      ? t('overview.collecting.readyBy', {
          date: formatShort(fromDay(m.transferDeadline)),
          left: left === 0 ? t('overview.dayWords.today') : t('overview.left', { days: t('overview.counts.day', { n: left }) }),
        })
      : t('overview.collecting.noSession')

  return (
    <Link
      to={memberPath(m.code)}
      style={{ animationDelay: `${0.25 + index * 0.05}s` }}
      className="flex animate-rise flex-col items-center gap-3.5 rounded-[26px] bg-surface-2 p-5 text-center text-ink transition hover:-translate-y-0.5 hover:bg-surface"
    >
      <span className="relative size-28 shrink-0">
        <svg viewBox="0 0 112 112" className="size-full -rotate-90 rtl:-scale-y-100" aria-label={t('overview.collecting.checksPass', { done: CHECKS.length - missing.length, total: CHECKS.length })}>
          {CHECKS.map(([k], i) => (
            <circle
              key={k}
              cx="56"
              cy="56"
              r={R}
              fill="none"
              stroke={ready[k] ? '#367b7f' : '#f3d6b3'}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${SLOT - 15} ${2 * Math.PI * R}`}
              strokeDashoffset={-(SLOT * i + 7.5)}
            />
          ))}
        </svg>
        <span className="absolute inset-5.5 grid place-items-center rounded-full bg-brand-900 text-lg text-white">{initials(m.name)}</span>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-base">{m.name}</span>
        <span className={cx('text-[13px]', late ? TONES.danger.text : 'text-muted')}>
          {t('overview.collecting.progress', { done: CHECKS.length - missing.length, total: CHECKS.length, due })}
        </span>
      </span>
      <span className="flex min-h-23 w-full flex-col items-center gap-2 border-t border-line pt-3">
        <span className="eyebrow text-[11px] text-faint rtl:tracking-normal">{missing.length ? t('overview.collecting.stillNeeded') : t('overview.collecting.allPass', { count: CHECKS.length })}</span>
        <span className="flex max-h-15.5 flex-wrap justify-center gap-1.5 overflow-hidden">
          {missing.length === 0 && <span className={cx('inline-flex h-7 items-center rounded-full px-2.5 text-xs', TONES.success.fill, TONES.success.text)}>{t('overview.collecting.ready')}</span>}
          {missing.slice(0, 3).map(([k, icon]) => (
            <span key={k} className={cx('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs', TONES.warn.fill, TONES.warn.text)}>
              <Icon name={icon} className="size-3" strokeWidth={1.8} />
              {t(`overview.checks.${k}`)}
            </span>
          ))}
          {missing.length > 3 && <span className="inline-flex h-7 items-center rounded-full bg-panel px-2.5 text-xs text-soft">{t('overview.collecting.more', { count: missing.length - 3 })}</span>}
        </span>
      </span>
    </Link>
  )
}
