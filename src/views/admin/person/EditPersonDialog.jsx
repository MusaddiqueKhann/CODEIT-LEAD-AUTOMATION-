import { useState } from 'react'
import { Button, cx, Field, Input, Modal, Select, TONES } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'

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
    <Modal id="edit-person-dialog-title"
      open={!!person}
      onClose={close}
      title={person && t('admin.person.edit.title', { name: person.name })}
      description={person && t('admin.person.edit.now', { role: label('role', person.role) })}
      footer={
        <>
          <Button id="edit-person-dialog-never-mind" variant="outline" onClick={close}>
            {t('shared.common.neverMind')}
          </Button>
          <Button id="edit-person-dialog-change-role" onClick={() => save(() => onSave(role))} disabled={!role || role === person?.role || busy}>
            {t('admin.person.edit.changeRole')}
          </Button>
        </>
      }
    >
      {person && (
        <div className="flex flex-col gap-3">
          <Field id="edit-person-dialog-new-role" label={t('admin.person.edit.newRole')}>
            {(props) => (
              <Select {...props} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">{t('shared.common.pickOne')}</option>
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
              {t('admin.person.edit.openWarn', { name: person.name, n: person.openCount })}
            </p>
          )}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-line pt-4">
            <span className="eyebrow text-faint">{t('admin.person.edit.account')}</span>
            <div className="flex items-end gap-2">
              <Field id="edit-person-dialog-email" label={t('admin.person.edit.email')} className="min-w-0 flex-1">
                {(props) => <Input {...props} type="email" dir="ltr" value={email ?? person.email} onChange={(e) => setEmail(e.target.value)} />}
              </Field>
              <Button id="edit-person-dialog-change-email" variant="soft" onClick={() => save(() => on.email(newEmail))} disabled={!newEmail || newEmail === person.email || busy}>
                {t('admin.person.edit.changeEmail')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button id="edit-person-dialog-reset" variant="soft" size="sm" onClick={job(on.reset)}>
                {t('admin.person.edit.reset')}
              </Button>
              {person.openCount > 0 && person.role !== 'admin' && (
                <Button id="edit-person-dialog-move" variant="soft" size="sm" onClick={job(on.move)}>
                  {t('admin.person.edit.move', { n: person.openCount })}
                </Button>
              )}
              {person.id !== me &&
                (person.active ? (
                  <Button id="edit-person-dialog-deactivate" variant="danger" size="sm" onClick={job(on.deactivate)}>
                    {t('admin.person.deactivate')}
                  </Button>
                ) : (
                  <Button id="edit-person-dialog-reactivate" variant="soft" size="sm" onClick={job(on.reactivate)}>
                    {t('admin.person.edit.reactivate')}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
