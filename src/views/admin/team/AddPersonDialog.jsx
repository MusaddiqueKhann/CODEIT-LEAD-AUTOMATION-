import { useState } from 'react'
import { Button, cx, Field, HoursEditor, Icon, IconButton, Input, Modal, Notice, Select } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useCopy } from '../../../controllers/shared/useCopy.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { MIN_PASSWORD, newPassword } from '../../../models/rules/password.js'

const STEPS = ['details', 'role', 'hours']
const blank = () => ({ name: '', email: '', password: newPassword(), role: '', language: 'en', hours: null })
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/**
 * Adding a person, one step at a time: 1 their name, work email (their username) and a temporary
 * password made for them; 2 their role and language (for the app, their alerts and team emails);
 * 3 their working hours. Then the username and password, each ready to copy. `onSave(form)`
 * resolves to the server's answer ({ password, emailed }) or null when it was refused.
 */
export function AddPersonDialog({ open, onClose, onSave }) {
  const { lists, settings, label } = useConfig()
  const { t } = useLang()
  const copy = useCopy()
  const [form, setForm] = useState(blank)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(null) // the server's answer, once they are on the team
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const a = (k, values) => t(`admin.team.add.${k}`, values)

  const shortPassword = form.password.trim().length < MIN_PASSWORD
  const ready = [form.name.trim() && isEmail(form.email) && !shortPassword, !!form.role, true][step]
  const close = () => {
    setForm(blank())
    setStep(0)
    setAdded(null)
    onClose()
  }
  const save = async () => {
    setBusy(true)
    const r = await onSave({ ...form, email: form.email.trim().toLowerCase(), password: form.password.trim() })
    setBusy(false)
    if (r) setAdded(r)
  }

  // The title, then a thin line of steps (the current one longer) and "Step 1 of 3 · Details".
  const header = (
    <div className="flex flex-col gap-2.5">
      <h2 className="ui-modal__title text-lg tracking-[-0.02em] text-ink">{a('title')}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden="true" className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span key={s} className={cx('v-add-person-dialog__step h-1.5 rounded-full transition-all', i === step ? 'w-10 bg-brand-700' : i < step ? 'w-5 bg-brand-700' : 'w-5 bg-chip')} />
          ))}
        </span>
        <span className="text-sm text-muted">{a('stepOf', { n: step + 1, total: STEPS.length, name: a(`steps.${STEPS[step]}`) })}</span>
      </div>
    </div>
  )

  const footer = added ? (
    <Button id="add-person-dialog-done" onClick={close}>
      {t('shared.common.done')}
    </Button>
  ) : (
    <>
      {step === 0 ? (
        <Button id="add-person-dialog-never-mind" variant="outline" onClick={close}>
          {t('shared.common.neverMind')}
        </Button>
      ) : (
        <Button id="add-person-dialog-back" variant="outline" onClick={() => setStep(step - 1)} disabled={busy}>
          {t('shared.common.back')}
        </Button>
      )}
      {step < STEPS.length - 1 ? (
        <Button id="add-person-dialog-next" onClick={() => setStep(step + 1)} disabled={!ready}>
          {t('shared.common.next')}
        </Button>
      ) : (
        <Button id="add-person-dialog-add" onClick={save} disabled={busy}>
          {busy ? a('adding') : a('submit')}
        </Button>
      )}
    </>
  )

  return (
    <Modal
      id="add-person-dialog"
      open={open}
      onClose={close}
      size="lg"
      title={added ? t('admin.team.onTeam', { name: form.name.trim() }) : a('title')}
      heading={added ? undefined : header}
      footer={footer}
    >
      {added ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">{a('signsIn', { name: form.name.trim() })}</p>
          <Secret
            id="add-person-dialog-username"
            label={a('username')}
            value={form.email.trim().toLowerCase()}
            copyLabel={a('copyUsername')}
            onCopy={() => copy(form.email.trim().toLowerCase(), a('usernameCopied'))}
          />
          <p className="-mt-1 flex items-center gap-2 text-[13px] text-muted">
            <img src="/google.svg" alt="" className="size-3.5" />
            {a('google')}
          </p>
          <Secret
            id="add-person-dialog-password"
            label={a('password')}
            value={added.password}
            mono
            copyLabel={a('copyPassword')}
            onCopy={() => copy(added.password, t('shared.components.password.copied'))}
          />
          <Notice tone={added.emailed ? 'success' : 'warn'} icon={null}>
            {added.emailed ? t('shared.components.password.emailed') : t('shared.components.password.notEmailed')}
          </Notice>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h3 className="v-add-person-dialog__question text-lg tracking-[-0.02em] text-ink">{a(`ask.${STEPS[step]}.title`)}</h3>
            <p className="text-sm text-muted">{a(`ask.${STEPS[step]}.sub`)}</p>
          </div>

          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="add-person-dialog-name" label={a('name')}>
                {(props) => <Input {...props} autoFocus value={form.name} onChange={(e) => set({ name: e.target.value })} />}
              </Field>
              <Field id="add-person-dialog-email" label={a('email')}>
                {(props) => <Input {...props} type="email" dir="ltr" value={form.email} onChange={(e) => set({ email: e.target.value })} />}
              </Field>
              <Field
                id="add-person-dialog-temporary-password"
                label={a('password')}
                hint={a('passwordHint')}
                error={shortPassword ? t('shared.errors.password_short') : undefined}
                className="sm:col-span-2"
              >
                {(props) => (
                  <Input
                    {...props}
                    dir="ltr"
                    className="pe-12 font-mono tracking-[0.06em]"
                    error={shortPassword}
                    value={form.password}
                    onChange={(e) => set({ password: e.target.value })}
                    trailing={
                      <IconButton
                        id="add-person-dialog-make-another"
                        icon="refresh"
                        label={a('makeAnother')}
                        title
                        size={9}
                        look="soft"
                        className="absolute end-1 top-1/2 -translate-y-1/2"
                        onClick={() => set({ password: newPassword() })}
                      />
                    }
                  />
                )}
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="add-person-dialog-role" label={a('role')}>
                {(props) => (
                  <Select {...props} autoFocus value={form.role} onChange={(e) => set({ role: e.target.value })}>
                    <option value="">{t('shared.common.pickOne')}</option>
                    {(lists.role ?? []).map((r) => (
                      <option key={r.key} value={r.key}>
                        {label('role', r.key)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field id="add-person-dialog-language" label={a('language')}>
                {(props) => (
                  <Select {...props} value={form.language} onChange={(e) => set({ language: e.target.value })}>
                    {['en', 'ar'].map((l) => (
                      <option key={l} value={l} lang={l}>
                        {a(`languages.${l}`)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          )}

          {step === 2 && (
            <HoursEditor value={form.hours} office={settings.officeHours} onChange={(hours) => set({ hours })} />
          )}
        </div>
      )}
    </Modal>
  )
}

/** One thing to hand over (the username, the password): its name, the value, and Copy. */
function Secret({ id, label, value, mono = false, copyLabel, onCopy }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] text-soft">{label}</span>
      <div className="flex items-center gap-2 rounded-[14px] bg-surface px-4 py-3">
        {/* Only the value reads left to right; the row itself mirrors with the page. */}
        <span id={`${id}-value`} dir="ltr" className={cx('min-w-0 flex-1 truncate text-start text-ink', mono ? 'font-mono text-lg tracking-[0.06em]' : 'text-[15px]')}>
          {value}
        </span>
        <Button id={`${id}-copy`} variant="outline" size="sm" onClick={onCopy}>
          <Icon name="copy" className="size-3.5" strokeWidth={1.8} />
          {copyLabel}
        </Button>
      </div>
    </div>
  )
}
