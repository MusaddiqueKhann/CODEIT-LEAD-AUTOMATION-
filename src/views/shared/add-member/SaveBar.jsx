import Icon from '../../../components/Icon.jsx'
import { Button, cx } from '../../../components/ui/index.js'
import { formatShort } from '../../../models/rules/format.js'
import { toMinutes, toTime } from '../../../models/rules/time.js'
import { TONES } from '../../../components/tones.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'

/**
 * The bar that stays in view while the form scrolls under it: the chosen time, what is still
 * needed to save, Cancel and Save. Everything else (files, hardware) can follow later.
 */
export function SaveBar({ slot, length, missing, busy, onCancel, onSave }) {
  const { t } = useLang()
  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-[20px] bg-panel py-3 pe-3 ps-4 shadow-[0_20px_40px_-20px_rgba(17,24,39,0.3)] ring-1 ring-line">
      <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', TONES.success.text, slot ? TONES.success.fill : 'bg-surface')}>
        <Icon name="calendar" className="size-4.5" strokeWidth={1.8} />
      </span>
      <div className="flex min-w-45 flex-1 flex-col gap-px">
        <span className="text-[15px] text-ink">
          {slot ? `${formatShort(slot.date)} · ${slot.time} – ${toTime(toMinutes(slot.time) + length)}` : t('members.saveBar.noTime')}
        </span>
        <span className={cx('text-[13px]', missing.length ? TONES.warn.text : 'text-muted')}>
          {missing.length ? t('members.saveBar.stillNeeded', { list: missing.join(t('members.add.separator')) }) : t('members.saveBar.ready')}
        </span>
      </div>
      <Button variant="outline" onClick={onCancel} disabled={busy}>
        {t('common.cancel')}
      </Button>
      <Button onClick={onSave} disabled={missing.length > 0 || busy}>
        {busy ? t('common.saving') : t('members.saveBar.save')}
      </Button>
    </div>
  )
}
