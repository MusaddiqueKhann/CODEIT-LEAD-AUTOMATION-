import Icon from '../../../components/Icon.jsx'
import { Button, cx } from '../../../components/ui/index.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'

/**
 * One section of Company settings, as in the design: a teal icon tile, its name and line
 * (settings.sections.<id>), an optional brand button at the end (`action`: { label, onClick }),
 * then the body. `id` is also the anchor (#timing, #docs…). `fill` makes it take the rest of a
 * fixed-height page (laptop size up), so what's inside can scroll on its own.
 */
export function Section({ id, icon, action, children, className, fill = false }) {
  const { t } = useLang()
  return (
    <section id={id} className={cx('flex min-w-0 scroll-mt-4 animate-rise flex-col gap-5.5 rounded-card bg-panel px-7 pt-5.5 pb-6 shadow-card', fill && 'lg:min-h-0 lg:flex-1')}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-brand-700 text-white">
          <Icon name={icon} className="size-5" strokeWidth={1.8} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 ps-0.5">
          <h2 className="text-h2 text-ink">{t(`settings.sections.${id}.title`)}</h2>
          <span className="text-[13px] text-muted">{t(`settings.sections.${id}.sub`)}</span>
        </span>
        {action && (
          <Button onClick={action.onClick} className="shrink-0 gap-2">
            <Icon name="plus" className="size-3.75" strokeWidth={2.2} />
            {action.label}
          </Button>
        )}
      </div>
      <div className={cx('flex min-w-0 flex-col gap-3.5', fill && 'lg:min-h-0 lg:flex-1', className)}>{children}</div>
    </section>
  )
}
