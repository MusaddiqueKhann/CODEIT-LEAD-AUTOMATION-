import { useState } from 'react'
import { Button } from './Button.jsx'
import { Field, Select, Textarea } from './Field.jsx'
import { Modal } from './Modal.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'

/**
 * Asks for a reason before an action (Send back, Lost, Cancel, No-show…). With `choices`, a
 * reason is picked from the list and the text is an optional note; without, the text is the
 * reason and is required unless `optional`. `onConfirm({ choice, text })` resolves true to close.
 */
export function ReasonDialog({ id, open, onClose, onConfirm, title, description, label: given, choices, optional = false, confirmLabel, tone = 'primary' }) {
  const { t } = useLang()
  const label = given ?? t('shared.common.reason')
  const [choice, setChoice] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = choices ? choice !== '' : optional || text.trim() !== ''

  const confirm = async () => {
    setBusy(true)
    const done = await onConfirm({ choice, text: text.trim() })
    setBusy(false)
    if (done) {
      setChoice('')
      setText('')
      onClose()
    }
  }

  return (
    <Modal
      id={id}
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button id={id && `${id}-cancel`} variant="outline" onClick={onClose}>
            {t('shared.common.neverMind')}
          </Button>
          <Button id={id && `${id}-confirm`} variant={tone === 'danger' ? 'danger' : 'primary'} disabled={!ready || busy} onClick={confirm}>
            {busy ? t('shared.common.saving') : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {description && <p className="text-sm text-muted">{description}</p>}
        {choices && (
          <Field id={id && `${id}-choice`} label={label}>
            {(props) => (
              <Select {...props} value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">{t('shared.common.pickOne')}</option>
                {choices.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field id={id && `${id}-note`} label={choices ? t('shared.common.noteOptional') : optional ? t('shared.common.optional', { label }) : label}>
          {(props) => <Textarea {...props} rows={3} value={text} onChange={(e) => setText(e.target.value)} />}
        </Field>
      </div>
    </Modal>
  )
}
