import Icon from '../Icon.jsx'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { byReadiness, dueOn, inDaysLabel, readiness } from '../../models/rules/members.js'
import { TONES } from '../tones.js'
import { cx } from '../ui/index.js'

const MAX_DAYS = 14 // past two weeks the day marks squeeze into 15

/**
 * When every document will be in: the date, a day-by-day line from today to it (each file's due
 * day marked), and a tile per file, the ones still to send first. `state` is from docState.
 */
export function ReadyBy({ keys, state }) {
  const { meta, label, active } = useConfig()
  const { t } = useLang()
  const tally = readiness(state, keys)
  const left = tally.total - tally.done
  const all = left === 0
  const span = tally.latest == null ? 0 : Math.min(tally.latest, MAX_DAYS)
  const marks = new Set(keys.map((k) => state[k]).filter((v) => typeof v === 'number').map((d) => Math.round((d * span) / (tally.latest || 1))))

  return (
    <div className="grid gap-x-7 gap-y-5 rounded-[24px] px-6 py-5.5 ring-1 ring-line ring-inset md:grid-cols-[auto_minmax(0,1fr)]">
      <div className="flex flex-col justify-between gap-3.5 border-line md:w-60 md:border-e md:pe-7">
        <span className="eyebrow text-faint">{t('shared.ready.title')}</span>
        <span className={cx('text-stat', all ? TONES.success.text : tally.unmarked ? 'text-muted' : 'text-ink')}>
          {all ? t('shared.ready.allIn') : tally.unmarked ? t('shared.ready.noDate') : dueOn(tally.latest)}
        </span>
        <div className="flex flex-col gap-2">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${span + 1}, minmax(0, 1fr))` }}>
            {Array.from({ length: span + 1 }, (_, i) => (
              <span
                key={i}
                className={cx(
                  'h-1.5 rounded-full',
                  all ? 'bg-success' : i === 0 ? 'bg-brand-700' : i === span ? 'bg-warn' : marks.has(i) ? 'bg-warn/45' : 'bg-surface-hover',
                )}
              />
            ))}
          </div>
          <span className="flex justify-between gap-2 text-xs text-faint">
            <span>{t('shared.ready.today')}</span>
            <span className={all ? TONES.success.text : TONES.warn.text}>
              {all
                ? t('shared.ready.allUploaded')
                : tally.unmarked
                  ? t('shared.ready.unmarked', { n: tally.unmarked })
                  : t('shared.ready.line', {
                      when: inDaysLabel(active('due_choice'), tally.latest, t, (c) => label('due_choice', c.key)),
                      left: t('shared.ready.filesLeft', { n: left }),
                    })}
            </span>
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3.5">
        <span className="flex justify-between text-sm text-ink">
          {t('shared.ready.uploadedOf', { done: tally.done, total: tally.total })}
          <span className="text-faint">{all ? t('shared.ready.nothingToGo') : t('shared.ready.toGo', { n: left })}</span>
        </span>
        <div className="scrollbar-slim flex gap-2 overflow-x-auto pb-0.5">
          {[...keys].sort(byReadiness(state)).map((k) => {
            const v = state[k]
            const done = v === true
            const due = typeof v === 'number'
            return (
              <div
                key={k}
                className={cx(
                  'flex shrink-0 basis-26 flex-col items-center gap-2 rounded-[18px] px-1.5 pt-3.5 pb-3',
                  done ? 'bg-success-wash' : due ? 'bg-warn-wash' : 'bg-surface-2',
                )}
              >
                <span
                  className={cx(
                    'relative grid h-11 w-9.5 place-items-center rounded-[8px_14px_8px_8px] rtl:rounded-[14px_8px_8px_8px] bg-panel shadow-[0_4px_10px_-6px_rgba(30,50,80,0.25)]',
                    done ? TONES.success.text : due ? TONES.warn.text : 'text-ghost',
                  )}
                >
                  <Icon name="file" className="size-4" strokeWidth={1.8} />
                  {(done || due) && (
                    <span className={cx('absolute -end-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full text-white ring-2 ring-white', done ? 'bg-success' : 'bg-warn')}>
                      <Icon name={done ? 'check' : 'clock'} className="size-2.75" strokeWidth={done ? 3 : 2.4} />
                    </span>
                  )}
                </span>
                <span className="mt-1 max-w-full truncate text-[13px] text-ink">{meta('document', k, 'short') || label('document', k)}</span>
                <span className={cx('text-[11px] whitespace-nowrap', done ? TONES.success.text : due ? TONES.warn.text : 'text-muted')}>
                  {done ? t('shared.ready.tileUploaded') : due ? dueOn(v) : t('shared.ready.tileNoDate')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
