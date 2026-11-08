import { FormBar } from '@/components'
import { useLang } from '../../controllers/shared/LangContext.jsx'

/** Stays in view once the form has changes: Save changes, or Discard them. */
export function EditBar({ busy, onSave, onCancel }) {
  const { t } = useLang()
  return (
    <FormBar
      className="ps-5"
      cancelLabel={t('sales.member.editBar.discard')}
      saveLabel={t('sales.member.editBar.save')}
      savingLabel={t('shared.common.saving')}
      busy={busy}
      onCancel={onCancel}
      onSave={onSave}
    >
      <span className="min-w-45 flex-1 text-sm text-muted">{t('sales.member.editBar.unsaved')}</span>
    </FormBar>
  )
}
