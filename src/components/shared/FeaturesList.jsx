import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { TONES } from '../tones.js'
import { Button, cx } from '../ui/index.js'

/** Each feature with a Yes / No switch; an unanswered one has neither picked. */
export function FeaturesList({ keys, values, onChange, readOnly = false }) {
  const { label } = useConfig()
  const { t } = useLang()
  return (
    <div className="flex flex-col rounded-2xl px-4 ring-1 ring-line ring-inset">
      {keys.map((k) => (
        <div key={k} className="flex flex-wrap items-center gap-3 border-b border-line-soft py-3 last:border-b-0">
          <span className="min-w-0 flex-1 text-sm text-ink">{label('feature', k)}</span>
          <div role="group" aria-label={label('feature', k)} className="flex shrink-0 gap-1 rounded-xl bg-surface-2 p-1">
            {[
              [t('common.yes'), true],
              [t('common.no'), false],
            ].map(([word, v]) => {
              const on = values[k] === v
              return (
                <Button
                  key={word}
                  variant="bare"
                  aria-pressed={on}
                  disabled={readOnly}
                  onClick={() => onChange(k, v)}
                  className={cx(
                    'h-9 min-w-16 rounded-[10px] px-3.5 text-sm transition',
                    on ? cx('bg-panel shadow-sm', v ? TONES.success.text : 'text-ink') : 'text-muted hover:text-ink',
                  )}
                >
                  {word}
                </Button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
