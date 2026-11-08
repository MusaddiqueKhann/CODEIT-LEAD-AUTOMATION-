import { useState } from 'react'
import { Option } from '../../../components/shared/index.js'
import { Button, Field, Modal, Select } from '../../../components/ui/index.js'
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
    <Modal
      open={!!person}
      onClose={onClose}
      title={t('person.move.title')}
      description={person && t('person.move.description', { n: person.openCount, name: person.name })}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t('common.neverMind')}
          </Button>
          <Button onClick={move} disabled={!ready || busy}>
            {busy ? t('person.move.moving') : t('person.move.submit')}
          </Button>
        </>
      }
    >
      {person && (
        <div className="flex flex-col gap-4">
          {!sales && (
            <div className="flex flex-wrap gap-2">
              <Option on={mode === 'auto'} onClick={() => setMode('auto')} className="h-10 rounded-full px-4 text-sm">
                {t('person.move.auto')}
              </Option>
              <Option on={mode === 'one'} onClick={() => setMode('one')} className="h-10 rounded-full px-4 text-sm">
                {t('person.move.one')}
              </Option>
            </div>
          )}
          {how === 'one' ? (
            <Field label={t('person.move.toWhich', { role: label('role', person.role) })}>
              {(props) => (
                <Select {...props} value={to} onChange={(e) => setTo(e.target.value)}>
                  <option value="">{t('common.pickOne')}</option>
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
              {t('person.move.autoNote', { name: person.name })}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
