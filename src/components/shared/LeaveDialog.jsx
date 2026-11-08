import { useState } from 'react'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { Button } from '../ui/Button.jsx'
import { Field, Input } from '../ui/Field.jsx'
import { Modal } from '../ui/Modal.jsx'

/** Leave from one day to another. Never blocked: the result says what it touches. `onSave(from, to)` resolves true to close. */
export function LeaveDialog({ open, onClose, name, onSave }) {
  const { t } = useLang()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = from && to && to >= from

  const save = async () => {
    setBusy(true)
    const done = await onSave(from, to)
    setBusy(false)
    if (done) {
      setFrom('')
      setTo('')
      onClose()
    }
  }

  return (
    <Modal id="leave-dialog-title"
      open={open}
      onClose={onClose}
      title={t('shared.components.leave.title')}
      description={name}
      footer={
        <>
          <Button id="leave-dialog-never-mind" variant="outline" onClick={onClose}>
            {t('shared.common.neverMind')}
          </Button>
          <Button id="leave-dialog-saving" onClick={save} disabled={!ready || busy}>
            {busy ? t('shared.common.saving') : t('shared.components.leave.save')}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="leave-dialog-from" label={t('shared.components.leave.from')}>{(props) => <Input {...props} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
        <Field id="leave-dialog-to" label={t('shared.components.leave.to')}>{(props) => <Input {...props} type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
      </div>
      <p className="mt-3 text-sm text-muted">{t('shared.components.leave.note')}</p>
    </Modal>
  )
}
