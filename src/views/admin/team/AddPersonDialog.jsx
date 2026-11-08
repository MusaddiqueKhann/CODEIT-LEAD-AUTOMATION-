import { useState } from 'react'
import { HoursEditor } from '../../../components/shared/index.js'
import { Button, Field, Input, Modal, Select } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'

const EMPTY = { name: '', email: '', role: '', hours: null, password: '', language: 'en' }

/**
 * Name, work email (their username), role, language (for the app, their alerts and team emails) and
 * hours. The temporary password is made for them unless typed.
 */
export function AddPersonDialog({ open, onClose, onSave }) {
  const { lists, settings, label } = useConfig()
  const { t } = useLang()
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const ready = form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && form.role

  const save = async () => {
    setBusy(true)
    const done = await onSave(form)
    setBusy(false)
    if (done) {
      setForm(EMPTY)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('team.add.title')}
      description={t('team.add.description')}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t('common.neverMind')}
          </Button>
          <Button onClick={save} disabled={!ready || busy}>
            {busy ? t('team.add.adding') : t('team.add.submit')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('team.add.name')}>{(props) => <Input {...props} value={form.name} onChange={(e) => set({ name: e.target.value })} />}</Field>
          <Field label={t('team.add.email')}>
            {(props) => <Input {...props} type="email" dir="ltr" value={form.email} onChange={(e) => set({ email: e.target.value })} />}
          </Field>
          <Field label={t('team.add.role')}>
            {(props) => (
              <Select {...props} value={form.role} onChange={(e) => set({ role: e.target.value })}>
                <option value="">{t('common.pickOne')}</option>
                {(lists.role ?? []).map((r) => (
                  <option key={r.key} value={r.key}>
                    {label('role', r.key)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t('team.add.language')}>
            {(props) => (
              <Select {...props} value={form.language} onChange={(e) => set({ language: e.target.value })}>
                {['en', 'ar'].map((l) => (
                  <option key={l} value={l} lang={l}>
                    {t(`team.add.languages.${l}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t('team.add.password')} hint={t('team.add.passwordHint')}>
            {(props) => <Input {...props} dir="ltr" value={form.password} onChange={(e) => set({ password: e.target.value })} />}
          </Field>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">{t('team.add.hours')}</span>
          <HoursEditor value={form.hours} office={settings.officeHours} onChange={(hours) => set({ hours })} />
        </div>
      </div>
    </Modal>
  )
}
