import { IconButton } from '../ui/IconButton.jsx'
import Icon from '../Icon.jsx'
import { cx } from '../cx.js'
import { useLang } from '../../controllers/shared/LangContext.jsx'

/**
 * The one page header: a white card with the title and a grey line under it. Every page uses it.
 *
 * `back` is a path for the round back button, `media` sits before the title (an avatar; the
 * title then steps down to 28px as in the design), `children` sit between the title and
 * `actions` (a search box), and `actions` sit at the end. `nav` ({ onPrev, onNext }) puts round
 * arrows either side of a centred title, as the Calendar steps through dates.
 */
export function PageHeader({ title, sub, back, media, children, actions, nav }) {
  const { t } = useLang()
  const heading = (
    <div className={cx('flex min-w-0 flex-col', nav ? 'w-75 shrink items-center text-center' : 'flex-[1_1_280px]', media ? 'gap-1.5' : 'gap-0.5')}>
      <h1 className={cx('text-page text-ink', nav && 'whitespace-nowrap')}>{title}</h1>
      {sub && <div className={cx('text-[13px] text-muted', nav && 'max-w-full truncate')}>{sub}</div>}
    </div>
  )

  return (
    <header className="flex shrink-0 animate-rise flex-wrap items-center gap-3.5 rounded-card bg-panel px-6 py-5 shadow-card">
      {back && (
        <IconButton id="page-header-back" icon="chevronLeft" label={t('shared.common.back')} to={back} strokeWidth={2} className="hover:-translate-x-0.5 rtl:hover:translate-x-0.5" />
      )}
      {media}
      {nav ? (
        <div className="flex min-w-0 flex-[1_1_320px] items-center gap-3.5">
          <Arrow id="page-header-previous" label={t('shared.common.previous')} icon="chevronLeft" onClick={nav.onPrev} />
          {heading}
          <Arrow id="page-header-next" label={t('shared.common.next')} icon="chevronRight" onClick={nav.onNext} />
        </div>
      ) : (
        heading
      )}
      {children}
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

function Arrow({ id, label, icon, onClick }) {
  return (
    <button id={id}
      type="button"
      aria-label={label}
      onClick={onClick}
      className="ui-page-header__{id} grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-surface text-ink transition hover:bg-surface-hover"
    >
      <Icon name={icon} className="size-4" strokeWidth={2.2} />
    </button>
  )
}
