import { cx, FormBar, Icon, TONES } from '@/components'
import { formatShort } from '../../../models/rules/format.js'
import { toMinutes, toTime } from '../../../models/rules/time.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'

/**
 * The bar that stays in view while the form scrolls under it: the chosen time, what is still
 * needed to save, Cancel and Save. Everything else (files, hardware) can follow later.
 */
export function SaveBar({ slot, length, missing, busy, onCancel, onSave }) {
  const { t } = useLang()
  return (
    <FormBar
      className="ps-4"
      cancelLabel={t('shared.common.cancel')}
      saveLabel={t('shared.members.saveBar.save')}
      savingLabel={t('shared.common.saving')}
      busy={busy}
      saveDisabled={missing.length > 0}
      onCancel={onCancel}
      onSave={onSave}
    >
      <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', TONES.success.text, slot ? TONES.success.fill : 'bg-surface')}>
        <Icon name="calendar" className="size-4.5" strokeWidth={1.8} />
      </span>
      <div className="flex min-w-45 flex-1 flex-col gap-px">
        <span className="text-[15px] text-ink">
          {slot ? `${formatShort(slot.date)} · ${slot.time} – ${toTime(toMinutes(slot.time) + length)}` : t('shared.members.saveBar.noTime')}
        </span>
        <span className={cx('text-[13px]', missing.length ? TONES.warn.text : 'text-muted')}>
          {missing.length ? t('shared.members.saveBar.stillNeeded', { list: missing.join(t('shared.common.listJoin')) }) : t('shared.members.saveBar.ready')}
        </span>
      </div>
    </FormBar>
  )
}
