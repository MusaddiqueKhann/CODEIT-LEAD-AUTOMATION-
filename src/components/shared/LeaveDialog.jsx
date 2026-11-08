import { useState } from 'react'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { Button, Field, Input, Modal } from '../ui/index.js'

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
    <Modal
      open={open}
      onClose={onClose}
      title={t('team.leave.title')}
      description={name}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t('common.neverMind')}
          </Button>
          <Button onClick={save} disabled={!ready || busy}>
            {busy ? t('common.saving') : t('team.leave.save')}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('team.leave.from')}>{(props) => <Input {...props} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
        <Field label={t('team.leave.to')}>{(props) => <Input {...props} type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
      </div>
      <p className="mt-3 text-sm text-muted">{t('team.leave.note')}</p>
    </Modal>
  )
}
