import { useState } from 'react'
import Icon from '../../../components/Icon.jsx'
import { Button, ConfirmDialog, Field, Input, Modal, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { emailKeySet, setEmailKey, updateSettings } from '../../../models/data/settings.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { useRows } from '../../../controllers/shared/useRows.js'
import { Section } from './Section.jsx'
import { useUnsaved } from '../../../controllers/shared/unsaved.js'

const EMPTY = {
  name: '', name_ar: '', legal_name: '', legal_name_ar: '', vat_number: '', app_name: '', app_url: '',
  product_name: '', website: '', sender_email: '', support_phone: '', address: '',
}
/*
 * The design's three groups of tiles: [field, icon, input props, the field shown under it only
 * while editing]. Each tile's words are settings.company.fields.<field> and .notes.<field>.
 */
const GROUPS = [
  ['brand', [
    ['name', 'building', {}, 'name_ar'],
    ['legal_name', 'fileText', { small: true }, 'legal_name_ar'],
    ['vat_number', 'receipt', { dir: 'ltr', inputMode: 'numeric' }],
  ]],
  ['product', [
    ['app_name', 'overview', {}, 'app_url'],
    ['product_name', 'box', {}],
    ['website', 'globe', { dir: 'ltr' }],
  ]],
  ['contact', [
    ['sender_email', 'mail', { dir: 'ltr', type: 'email' }],
    ['support_phone', 'phone', { dir: 'ltr', type: 'tel' }],
    ['address', 'mapPin', {}],
  ]],
]
const RTL = ['name_ar', 'legal_name_ar']

/**
 * Admin: the names every screen and email uses, the company's numbers and contact details, and
 * the email service: the sender address (saved with the rest) and the SendGrid key (saved at
 * once into Vault, never shown again).
 */
export function CompanyTab({ after }) {
  const { settings } = useConfig()
  const { t } = useLang()
  const { run } = useAction(after)
  const base = { ...EMPTY, ...settings.company }
  const [c, setC] = useState(base)
  const set = (k) => (e) => setC((x) => ({ ...x, [k]: e.target.value }))

  useUnsaved('company', JSON.stringify(c) !== JSON.stringify(base), () => run(() => updateSettings({ company: c })))

  return (
    <Section id="company" icon="building" className="gap-4.5">
      {GROUPS.map(([group, fields]) => (
        <div key={group} className="flex flex-col gap-2">
          <span className="px-1 text-[11px] tracking-[0.14em] text-muted uppercase">{t(`settings.company.groups.${group}`)}</span>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
            {fields.map(([k, icon, { small, ...props }, extra]) => (
              <label
                key={k}
                className="group flex min-h-25 min-w-0 cursor-text items-center gap-3 rounded-[22px] bg-surface py-4 ps-5 pe-4 transition focus-within:bg-panel focus-within:ring-[1.5px] focus-within:ring-brand-700 focus-within:ring-inset"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1.25">
                  <span className="text-xs text-soft">{t(`settings.company.fields.${k}`)}</span>
                  <input
                    value={c[k] ?? ''}
                    onChange={set(k)}
                    aria-label={t(`settings.company.fields.${k}`)}
                    placeholder={t('settings.company.empty')}
                    // English names read left to right even on an Arabic page, but sit on its reading side.
                    dir="auto"
                    className={cx(
                      'w-full min-w-0 truncate bg-transparent p-0 leading-tight tracking-[-0.02em] text-ink outline-none placeholder:text-ghost rtl:text-right',
                      small ? 'text-[17px]' : 'text-h2',
                    )}
                    {...props}
                  />
                  <span className="truncate text-xs text-muted group-focus-within:hidden">
                    {extra && RTL.includes(extra) && c[extra] ? (
                      <>
                        <bdi dir="rtl">{c[extra]}</bdi> · {t(`settings.company.notes.${k}`)}
                      </>
                    ) : (
                      t(`settings.company.notes.${k}`)
                    )}
                  </span>
                  {extra && (
                    // Kept from the old form, shown only while this tile is being edited.
                    <input
                      value={c[extra] ?? ''}
                      onChange={set(extra)}
                      placeholder={t(`settings.company.fields.${extra}`)}
                      aria-label={t(`settings.company.fields.${extra}`)}
                      dir={RTL.includes(extra) ? 'rtl' : 'ltr'}
                      className="hidden h-8 w-full min-w-0 rounded-lg bg-field px-2.5 text-[13px] text-ink outline-none placeholder:text-ghost group-focus-within:block"
                    />
                  )}
                </span>
                <span className="grid size-9 shrink-0 place-items-center self-center rounded-xl bg-panel text-brand-700">
                  <Icon name={icon} className="size-4" strokeWidth={1.8} />
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <EmailSending sender={c.sender_email} after={after} />
    </Section>
  )
}

/** The teal card: whether emails can go out, and the SendGrid key (add, replace or remove). */
function EmailSending({ sender, after }) {
  const { t } = useLang()
  const { run, busy } = useAction(after)
  const { data: hasKey, reload } = useRows(emailKeySet, 'email-key')
  const [typing, setTyping] = useState(null)
  const [removing, setRemoving] = useState(false)
  const save = async (key) => {
    if (await run(() => setEmailKey(key), t(key ? 'settings.company.key.saved' : 'settings.company.key.removed'))) {
      setTyping(null)
      reload()
    }
  }
  const state = hasKey ? (sender ? 'sending' : 'noSender') : sender ? 'noKey' : 'nothing'
  const light = 'h-10 shrink-0 gap-2 rounded-full bg-panel px-4 text-sm text-brand-700 transition hover:bg-brand-50'

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-brand-700 px-5 py-4.5 text-white">
      <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-white/16">
        <Icon name="mail" className="size-5" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-50 flex-1 flex-col gap-0.5">
        <span className="text-[17px]">{t('settings.company.key.title')}</span>
        <span className="text-[13px] text-brand-100">{t(`settings.company.key.${state}`, { sender })}</span>
      </span>
      <span className="flex items-center gap-2">
        {hasKey && (
          <Button variant="bare" onClick={() => setRemoving(true)} className="h-10 rounded-full px-3.5 text-sm text-white/85 transition hover:bg-white/12">
            {t('common.remove')}
          </Button>
        )}
        <Button variant="bare" onClick={() => setTyping('')} disabled={hasKey === undefined} className={cx(light, 'inline-flex items-center')}>
          <Icon name="key" className="size-3.5" strokeWidth={1.8} />
          {t(hasKey ? 'settings.company.key.replace' : 'settings.company.key.add')}
        </Button>
      </span>
      <Modal
        open={typing !== null}
        onClose={() => setTyping(null)}
        title={t(hasKey ? 'settings.company.key.replace' : 'settings.company.key.add')}
        description={t('settings.company.key.hint')}
        footer={
          <>
            <Button variant="outline" onClick={() => setTyping(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => save(typing)} disabled={!typing?.trim() || busy}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (typing.trim()) save(typing)
          }}
        >
          <Field label={t('settings.company.key.label')}>
            {(props) => (
              <Input {...props} autoFocus type="password" autoComplete="off" dir="ltr" placeholder="SG.…" value={typing ?? ''} onChange={(e) => setTyping(e.target.value)} />
            )}
          </Field>
        </form>
      </Modal>
      <ConfirmDialog
        open={removing}
        onClose={() => setRemoving(false)}
        onConfirm={() => save('')}
        title={t('settings.company.key.removeTitle')}
        description={t('settings.company.key.removeText')}
        confirmLabel={t('common.remove')}
      />
    </div>
  )
}
