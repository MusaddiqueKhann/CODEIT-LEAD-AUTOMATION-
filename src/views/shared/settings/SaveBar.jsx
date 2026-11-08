import Icon from '../../../components/Icon.jsx'
import { Button, cx } from '../../../components/ui/index.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'

/**
 * The bar under Settings: whether anything changed, and Cancel / Save settings for all of it. Its
 * words are settings.<words>.*. It sits at the bottom of the screen: pushed down on a short page
 * (mt-auto in the page's full-height column), held there on a long one (sticky).
 */
export function SaveBar({ words = 'bar', dirty, saved, busy, onCancel, onSave }) {
  const { t } = useLang()
  return (
    <div className="sticky bottom-4 z-5 mt-auto flex flex-wrap items-center gap-3.5 rounded-3xl bg-panel py-3 ps-4 pe-3 shadow-[0_24px_48px_-24px_rgb(30_50_80/0.35),0_0_0_1px_rgb(30_50_80/0.05)]">
      <span className={cx('grid size-10 shrink-0 place-items-center rounded-[13px] transition-colors', dirty ? 'bg-warn-bg text-warn-ink' : 'bg-success-bg text-success-ink')}>
        <Icon name={dirty ? 'pencil' : 'check'} className="size-4.5" strokeWidth={dirty ? 1.8 : 2.4} />
      </span>
      <span className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
        <span className="text-[15px] text-ink">{t(`settings.${words}.${dirty ? 'unsaved' : saved ? 'allSaved' : 'nothing'}`)}</span>
        <span className={cx('text-xs', dirty ? 'text-warn-ink' : 'text-muted')}>
          {t(`settings.${words}.${dirty ? 'unsavedSub' : saved ? 'savedSub' : 'nothingSub'}`)}
        </span>
      </span>
      <Button variant="outline" onClick={onCancel} disabled={!dirty || busy}>
        {t('common.cancel')}
      </Button>
      <Button onClick={onSave} disabled={!dirty || busy}>
        {busy ? t('common.saving') : t('settings.bar.save')}
      </Button>
    </div>
  )
}
