import { Button } from '../../components/ui/index.js'
import { useLang } from '../../controllers/shared/LangContext.jsx'

/** Stays in view once the form has changes: Save changes, or Discard them. */
export function EditBar({ busy, onSave, onCancel }) {
  const { t } = useLang()
  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-[20px] bg-panel py-3 pe-3 ps-5 shadow-[0_20px_40px_-20px_rgba(17,24,39,0.3)] ring-1 ring-line">
      <span className="min-w-45 flex-1 text-sm text-muted">{t('member.editBar.unsaved')}</span>
      <Button variant="outline" onClick={onCancel} disabled={busy}>
        {t('member.editBar.discard')}
      </Button>
      <Button onClick={onSave} disabled={busy}>
        {busy ? t('common.saving') : t('member.editBar.save')}
      </Button>
    </div>
  )
}
