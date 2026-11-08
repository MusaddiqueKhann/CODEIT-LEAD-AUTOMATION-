import { useState } from 'react'
import { Button, Field, Input, Modal, Select, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { TONES } from '../../../components/tones.js'

/**
 * Edit someone: a new role (members they hold stay with them until moved, so it warns), plus the
 * account jobs: a new sign-in email, a new temporary password, moving their members, and turning
 * their sign-in off or on. `on` has { email, reset, move, deactivate, reactivate }; each closes this.
 */
export function EditPersonDialog({ person, me, onClose, onSave, on }) {
  const { lists, label } = useConfig()
  const { t } = useLang()
  const [role, setRole] = useState('')
  const [email, setEmail] = useState(null)
  const [busy, setBusy] = useState(false)
  const close = () => {
    setRole('')
    setEmail(null)
    onClose()
  }
  const job = (fn) => () => {
    close()
    fn(person)
  }
  const newEmail = email?.trim().toLowerCase()

  const save = async (fn) => {
    setBusy(true)
    const done = await fn()
    setBusy(false)
    if (done) close()
  }

  return (
    <Modal
      open={!!person}
      onClose={close}
      title={person && t('person.edit.title', { name: person.name })}
      description={person && t('person.edit.now', { role: label('role', person.role) })}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            {t('common.neverMind')}
          </Button>
          <Button onClick={() => save(() => onSave(role))} disabled={!role || role === person?.role || busy}>
            {t('person.edit.changeRole')}
          </Button>
        </>
      }
    >
      {person && (
        <div className="flex flex-col gap-3">
          <Field label={t('person.edit.newRole')}>
            {(props) => (
              <Select {...props} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">{t('common.pickOne')}</option>
                {(lists.role ?? []).map((r) => (
                  <option key={r.key} value={r.key}>
                    {label('role', r.key)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {person.openCount > 0 && (
            <p className={cx('rounded-[12px] px-3.5 py-2.5 text-sm', TONES.warn.fill, TONES.warn.text)}>
              {t('person.edit.openWarn', { name: person.name, n: person.openCount })}
            </p>
          )}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-line pt-4">
            <span className="eyebrow text-faint">{t('person.edit.account')}</span>
            <div className="flex items-end gap-2">
              <Field label={t('person.edit.email')} className="min-w-0 flex-1">
                {(props) => <Input {...props} type="email" dir="ltr" value={email ?? person.email} onChange={(e) => setEmail(e.target.value)} />}
              </Field>
              <Button variant="soft" onClick={() => save(() => on.email(newEmail))} disabled={!newEmail || newEmail === person.email || busy}>
                {t('person.edit.changeEmail')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="soft" size="sm" onClick={job(on.reset)}>
                {t('person.edit.reset')}
              </Button>
              {person.openCount > 0 && person.role !== 'admin' && (
                <Button variant="soft" size="sm" onClick={job(on.move)}>
                  {t('person.edit.move', { n: person.openCount })}
                </Button>
              )}
              {person.id !== me &&
                (person.active ? (
                  <Button variant="danger" size="sm" onClick={job(on.deactivate)}>
                    {t('person.deactivate')}
                  </Button>
                ) : (
                  <Button variant="soft" size="sm" onClick={job(on.reactivate)}>
                    {t('person.edit.reactivate')}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
