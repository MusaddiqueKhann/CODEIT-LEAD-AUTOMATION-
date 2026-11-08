import { useLang } from '../../controllers/shared/LangContext.jsx'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'
import { cx } from '../cx.js'
import { useCopy } from '../../controllers/shared/useCopy.js'
import { TONES } from '../tones.js'

/** After adding someone or resetting their password: the temporary password, shown once. */
export function PasswordResult({ result, onClose }) {
  const { t } = useLang()
  const copy = useCopy()
  return (
    <Modal id="password-result-signs-in"
      open={!!result}
      onClose={onClose}
      title={result?.title}
      footer={<Button id="password-result-done" onClick={onClose}>{t('shared.common.done')}</Button>}
    >
      {result && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {/* The email kept left to right inside an Arabic sentence. */}
            {t('shared.components.password.signsIn', { name: result.name, email: `\u2066${result.email}\u2069` })}
          </p>
          <div className="flex items-center gap-2 rounded-[14px] bg-surface px-4 py-3">
            {/* Only the password reads left to right; the row itself mirrors with the page. */}
            <span dir="ltr" className="flex-1 text-start font-mono text-lg tracking-[0.06em] text-ink">
              {result.password}
            </span>
            <Button id="password-result-copy" variant="outline" onClick={() => copy(result.password, t('shared.components.password.copied'))}>
              {t('shared.components.password.copy')}
            </Button>
          </div>
          <p className={cx('rounded-[12px] px-3.5 py-2.5 text-sm', result.emailed ? cx(TONES.success.fill, TONES.success.text) : cx(TONES.warn.fill, TONES.warn.text))}>
            {result.emailed ? t('shared.components.password.emailed') : t('shared.components.password.notEmailed')}
          </p>
        </div>
      )}
    </Modal>
  )
}
