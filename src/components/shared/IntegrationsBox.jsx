import Icon from '../Icon.jsx'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { Button, cx } from '../ui/index.js'

/**
 * The optional integrations as tick cards. Picking one that needs documents adds them to the documents.
 * Turned-off integrations stay visible only on members that already picked them.
 */
export function IntegrationsBox({ picked, onPick, readOnly = false }) {
  const { lists, label: name } = useConfig()
  const { t } = useLang()
  const items = (lists.integration ?? []).filter((o) => (readOnly ? picked.includes(o.key) : o.active || picked.includes(o.key)))
  // The documents only this integration brings (not ones every customer sends anyway, like the CR).
  const docCount = (k) => (lists.document ?? []).filter((d) => d.active && d.meta.integrations?.includes(k) && d.meta.plans?.length === 0).length
  if (readOnly && items.length === 0) return <p className="text-sm text-muted">{t('shared.integrations.none')}</p>
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-2">
      {items.map(({ key: k }) => {
        const on = picked.includes(k)
        return (
          <Button
            key={k}
            variant="bare"
            aria-pressed={on}
            disabled={readOnly}
            onClick={() => onPick(k)}
            className={cx(
              'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-start transition',
              on ? 'bg-brand-100' : 'bg-panel ring-1 ring-edge ring-inset hover:bg-surface-2',
            )}
          >
            <span
              className={cx(
                'grid size-8 shrink-0 place-items-center rounded-[10px]',
                on ? 'bg-brand-700 text-white' : 'bg-field text-faint',
              )}
            >
              <Icon name="link" className="size-4" strokeWidth={1.8} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="text-sm font-medium text-ink">{name('integration', k)}</span>
              <span className="text-xs text-muted">
                {docCount(k) ? t('shared.integrations.addsDocs', { n: docCount(k) }) : t('shared.integrations.noFile')}
              </span>
            </span>
            <span
              className={cx(
                'grid size-5 shrink-0 place-items-center rounded-full',
                on ? 'bg-brand-700 text-white' : 'ring-[1.5px] ring-faint ring-inset',
              )}
            >
              {on && <Icon name="check" className="size-3" strokeWidth={3} />}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
