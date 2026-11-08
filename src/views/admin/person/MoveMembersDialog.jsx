import { useState } from 'react'
import { Button, Field, Modal, Option, Select } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'

/** Moves someone's open members: all to one person, or picked again automatically for each. */
export function MoveMembersDialog({ person, onClose, onMove }) {
  const { team, label } = useConfig()
  const { t } = useLang()
  const [mode, setMode] = useState('auto')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)
  const sales = person?.role === 'sales'
  const others = team.filter((p) => person && p.role === person.role && p.active && p.id !== person.id)
  const how = sales ? 'one' : mode
  const ready = how === 'auto' || to

  const move = async () => {
    setBusy(true)
    const done = await onMove(how === 'auto' ? null : to)
    setBusy(false)
    if (done) {
      setTo('')
      setMode('auto')
      onClose()
    }
  }

  return (
    <Modal id="move-members-dialog-title"
      open={!!person}
      onClose={onClose}
      title={t('admin.person.move.title')}
      description={person && t('admin.person.move.description', { n: person.openCount, name: person.name })}
      footer={
        <>
          <Button id="move-members-dialog-never-mind" variant="outline" onClick={onClose}>
            {t('shared.common.neverMind')}
          </Button>
          <Button id="move-members-dialog-moving" onClick={move} disabled={!ready || busy}>
            {busy ? t('admin.person.move.moving') : t('admin.person.move.submit')}
          </Button>
        </>
      }
    >
      {person && (
        <div className="flex flex-col gap-4">
          {!sales && (
            <div className="flex flex-wrap gap-2">
              <Option id="move-members-dialog-auto" on={mode === 'auto'} onClick={() => setMode('auto')} className="h-10 rounded-full px-4 text-sm">
                {t('admin.person.move.auto')}
              </Option>
              <Option id="move-members-dialog-one" on={mode === 'one'} onClick={() => setMode('one')} className="h-10 rounded-full px-4 text-sm">
                {t('admin.person.move.one')}
              </Option>
            </div>
          )}
          {how === 'one' ? (
            <Field id="move-members-dialog-to-which" label={t('admin.person.move.toWhich', { role: label('role', person.role) })}>
              {(props) => (
                <Select {...props} value={to} onChange={(e) => setTo(e.target.value)}>
                  <option value="">{t('shared.common.pickOne')}</option>
                  {others.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : (
            <p className="text-sm text-muted">
              {t('admin.person.move.autoNote', { name: person.name })}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
