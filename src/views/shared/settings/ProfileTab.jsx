import { useRef, useState } from 'react'
import { Avatar, Button, Input, Option, Panel, ReadField, Switch, TextField } from '@/components'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { changePassword, updateMyProfile, uploadAvatar } from '../../../controllers/shared/profile.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { initials } from '../../../models/rules/time.js'
import { useUnsaved } from '../../../controllers/shared/unsaved.js'

const NO_PASSWORD = { current: '', next: '', again: '' }

/**
 * Your name, phone, photo and email alerts, and your password, both saved from the bar; and your
 * language, which changes at once.
 */
/** The design's settings field grid: as many 220px-wide columns as fit. */
const FIELDS = 'grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-4 gap-y-3.5'

export function ProfileTab({ after }) {
  const { profile, reloadProfile } = useAuth()
  const { t, lang, setLang } = useLang()
  const { settings } = useConfig()
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
      if (!form.name.trim()) throw new Error(t('shared.settings.profile.nameEmpty'))
      const avatarPath = photo ? await uploadAvatar(profile.id, photo.file) : profile.avatarPath
      await updateMyProfile({ ...form, avatarPath })
      setPhoto(null)
    }),
  )
  useUnsaved('password', !!(pw.current || pw.next || pw.again), async () => {
    const done = await run(async () => {
      if (!pw.current || !pw.next) throw new Error(t('shared.settings.profile.needBoth'))
      if (pw.next !== pw.again) throw new Error(t('shared.settings.profile.mismatch'))
      await changePassword(profile.email, pw.current, pw.next)
    })
    if (done) setPw(NO_PASSWORD)
    return done
  })

  return (
    <>
      <Panel id="profile-tab-details" className="[animation-delay:.08s]" note={t('shared.settings.profile.note')}>
        <div className="flex items-center gap-4">
          <Avatar initials={initials(form.name || profile.name)} src={photo?.url ?? profile.avatarUrl} className="size-16 text-lg" />
          <div className="flex flex-col gap-2">
            <span className="text-lg tracking-[-0.02em] text-ink">{form.name || profile.name}</span>
            <Input bare id="profile-tab-file"
              ref={file}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => e.target.files[0] && setPhoto({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) })}
            />
            <Button id="profile-tab-photo" variant="soft" size="sm" className="self-start" onClick={() => file.current.click()}>
              {t(profile.avatarUrl || photo ? 'shared.settings.profile.changePhoto' : 'shared.settings.profile.addPhoto')}
            </Button>
          </div>
        </div>
        <div className={FIELDS}>
          <TextField id="profile-tab-name" label={t('shared.settings.profile.name')} value={form.name} onChange={(e) => set({ name: e.target.value })} />
          <TextField id="profile-tab-phone" label={t('shared.settings.profile.phone')} type="tel" dir="ltr" placeholder={[settings.phonePrefix?.trim(), '5X XXX XXXX'].filter(Boolean).join(' ')} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          <ReadField label={t('shared.settings.profile.email')} dir="ltr">
            {profile.email}
          </ReadField>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink">
          <Switch id="profile-tab-email-alerts" on={form.emailAlerts} label={t('shared.settings.profile.emailAlerts')} onChange={(v) => set({ emailAlerts: v })} />
          {t('shared.settings.profile.emailAlerts')} <span className="text-muted">{t('shared.settings.profile.emailAlertsSub')}</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex min-w-48 flex-1 flex-col gap-0.5">
            <span className="text-sm text-ink">{t('shared.settings.profile.language')}</span>
            <span className="text-xs text-muted">{t('shared.settings.profile.languageSub')}</span>
          </span>
          <div className="flex gap-1.5">
            {['en', 'ar'].map((l) => (
              <Option id={`profile-tab-language-${l}`} key={l} on={lang === l} onClick={() => lang !== l && run(() => setLang(l))} className="h-10 rounded-full px-4 text-sm">
                {t(l === 'ar' ? 'shared.common.arabic' : 'shared.common.english')}
              </Option>
            ))}
          </div>
        </div>
      </Panel>

      <Panel id="profile-tab-password-2" className="[animation-delay:.08s]" title={t('shared.settings.profile.password')} sub={t('shared.settings.profile.passwordSub')}>
        <div className={FIELDS}>
          <TextField id="profile-tab-current" label={t('shared.settings.profile.current')} type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
          <TextField id="profile-tab-next" label={t('shared.settings.profile.next')} type="password" autoComplete="new-password" placeholder={t('shared.settings.profile.nextHint')} value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
          <TextField id="profile-tab-again" label={t('shared.settings.profile.again')} type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw((p) => ({ ...p, again: e.target.value }))} />
        </div>
        {pw.again && pw.next !== pw.again && <p className="-mt-2 text-xs text-danger-ink">{t('shared.settings.profile.mismatch')}</p>}
      </Panel>
    </>
  )
}
