import { useRef, useState } from 'react'
import { Option, ReadField, TextField } from '../../../components/shared/index.js'
import { Avatar, Button, Switch } from '../../../components/ui/index.js'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { changePassword, updateMyProfile, uploadAvatar } from '../../../models/data/auth.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { initials } from '../../../models/rules/time.js'
import { FIELDS, SettingsCard } from './SettingsCard.jsx'
import { useUnsaved } from '../../../controllers/shared/unsaved.js'

const NO_PASSWORD = { current: '', next: '', again: '' }

/**
 * Your name, phone, photo and email alerts, and your password, both saved from the bar; and your
 * language, which changes at once.
 */
export function ProfileTab({ after }) {
  const { profile, reloadProfile } = useAuth()
  const { t, lang, setLang } = useLang()
  const { run } = useAction(() => {
    reloadProfile()
    after()
  })
  const base = { name: profile.name, phone: profile.phone ?? '', emailAlerts: profile.emailAlerts }
  const [form, setForm] = useState(base)
  const [photo, setPhoto] = useState(null) // { file, url }
  const [pw, setPw] = useState(NO_PASSWORD)
  const file = useRef(null)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  useUnsaved('profile', !!photo || JSON.stringify(form) !== JSON.stringify(base), () =>
    run(async () => {
      if (!form.name.trim()) throw new Error(t('settings.profile.nameEmpty'))
      const avatarPath = photo ? await uploadAvatar(profile.id, photo.file) : profile.avatarPath
      await updateMyProfile({ ...form, avatarPath })
      setPhoto(null)
    }),
  )
  useUnsaved('password', !!(pw.current || pw.next || pw.again), async () => {
    const done = await run(async () => {
      if (!pw.current || !pw.next) throw new Error(t('settings.profile.needBoth'))
      if (pw.next !== pw.again) throw new Error(t('settings.profile.mismatch'))
      await changePassword(profile.email, pw.current, pw.next)
    })
    if (done) setPw(NO_PASSWORD)
    return done
  })

  return (
    <>
      <SettingsCard note={t('settings.profile.note')}>
        <div className="flex items-center gap-4">
          <Avatar initials={initials(form.name || profile.name)} src={photo?.url ?? profile.avatarUrl} className="size-16 text-lg" />
          <div className="flex flex-col gap-2">
            <span className="text-lg tracking-[-0.02em] text-ink">{form.name || profile.name}</span>
            <input
              ref={file}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => e.target.files[0] && setPhoto({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) })}
            />
            <Button variant="soft" size="sm" className="self-start" onClick={() => file.current.click()}>
              {t(profile.avatarUrl || photo ? 'settings.profile.changePhoto' : 'settings.profile.addPhoto')}
            </Button>
          </div>
        </div>
        <div className={FIELDS}>
          <TextField label={t('settings.profile.name')} value={form.name} onChange={(e) => set({ name: e.target.value })} />
          <TextField label={t('settings.profile.phone')} type="tel" dir="ltr" placeholder="+966 5X XXX XXXX" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          <ReadField label={t('settings.profile.email')} dir="ltr">
            {profile.email}
          </ReadField>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink">
          <Switch on={form.emailAlerts} label={t('settings.profile.emailAlerts')} onChange={(v) => set({ emailAlerts: v })} />
          {t('settings.profile.emailAlerts')} <span className="text-muted">{t('settings.profile.emailAlertsSub')}</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex min-w-48 flex-1 flex-col gap-0.5">
            <span className="text-sm text-ink">{t('settings.profile.language')}</span>
            <span className="text-xs text-muted">{t('settings.profile.languageSub')}</span>
          </span>
          <div className="flex gap-1.5">
            {['en', 'ar'].map((l) => (
              <Option key={l} on={lang === l} onClick={() => lang !== l && run(() => setLang(l))} className="h-10 rounded-full px-4 text-sm">
                {t(l === 'ar' ? 'common.arabic' : 'common.english')}
              </Option>
            ))}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={t('settings.profile.password')} sub={t('settings.profile.passwordSub')}>
        <div className={FIELDS}>
          <TextField label={t('settings.profile.current')} type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
          <TextField label={t('settings.profile.next')} type="password" autoComplete="new-password" placeholder={t('settings.profile.nextHint')} value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
          <TextField label={t('settings.profile.again')} type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw((p) => ({ ...p, again: e.target.value }))} />
        </div>
        {pw.again && pw.next !== pw.again && <p className="-mt-2 text-xs text-danger-ink">{t('settings.profile.mismatch')}</p>}
      </SettingsCard>
    </>
  )
}
