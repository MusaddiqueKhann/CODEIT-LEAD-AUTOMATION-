import { useRef, useState } from 'react'
import { Badge, Button, cx, Icon, IconButton, Modal, Switch, Textarea } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { sendTestEmail } from '../../../controllers/admin/settings.js'
import { fill } from '../../../models/rules/format.js'
import { sampleValues, unknownPlaceholders } from '../../../models/rules/placeholders.js'
import { useUnsaved } from '../../../controllers/shared/unsaved.js'
import { translate } from '../../../content/index.js'

/* A text's part, as admin.settings.texts.parts.<…>: an email's subject or body, or the page text's own key. */
const partOf = (key) => key.match(/_(subject|body)$/)?.[1] ?? key
const ICON = { customer: 'mail', team: 'mail', page: 'globe', calendar: 'calendar', activity: 'info' }

/** Stored wording with each {word} kept left to right, so it reads the same in Arabic. */
const codes = (text) => text.split(/(\{\w+\})/).map((part, i) => (i % 2 ? <bdi key={i} dir="ltr">{part}</bdi> : part))

/**
 * One message on the Emails & texts timeline (an email's subject and body, the customer page's
 * texts, the calendar title, or one alert or activity line): its dot, when it goes, its name and
 * the first line of its wording, its on/off switch, and a pencil that opens a popup with its
 * English and Arabic boxes, placeholder chips, a live preview filled with a made-up member, and
 * Send a test to me. Done keeps the wording for the Settings bar; Cancel puts it back. `run` is the
 * page's action runner.
 */
export function EmailMessage({ id, message, keys, on, onToggle, onSave, run }) {
  const { texts, brand, settings } = useConfig()
  const { t, lang } = useLang()
  // While the popup is open: the wording as it was, for Cancel to put back.
  const [open, setOpen] = useState(null)
  const [drafts, setDrafts] = useState(() => Object.fromEntries(keys.map((k) => [k, texts[k]])))
  const email = keys.includes(`${id}_body`)
  const changed = keys.filter((k) => drafts[k].en !== texts[k].en || drafts[k].ar !== texts[k].ar)
  const dirty = changed.length > 0
  // Kept here, not in the popup's boxes, so edits still wait for the Save bar once it closes.
  useUnsaved(`message:${id}`, dirty, async () => {
    for (const k of changed) if ((await onSave(k, drafts[k].en, drafts[k].ar)) === false) return false
  })
  const cancel = () => {
    setDrafts(open)
    setOpen(null)
  }
  const activity = message.group === 'activity'
  // An alert or activity line: log_*, alert_* or field_* (who reads it), named by its own wording.
  const kind = activity ? id.split('_')[0] : message.group
  const icon = kind === 'alert' ? 'bell' : ICON[message.group]
  const say = (k, lang) => fill(drafts[k]?.[lang] ?? '', sampleValues(lang, { brand, company: settings.company, reminderHours: settings.reminderHours }))
  // The stored wording in the reader's language, {words} and all.
  const raw = (k) => (drafts[k]?.[lang] || drafts[k]?.en || '').replace(/\s+/g, ' ')
  const hours = new Intl.ListFormat(lang, { type: 'conjunction' }).format(settings.reminderHours.map((n) => t('admin.settings.texts.hour', { n })))
  const when = activity ? t(`admin.settings.texts.toWhom.${kind}`) : t(`admin.settings.texts.when.${id}`, { hours, n: settings.feedbackReminderHours })
  const title = activity ? codes(raw(id)) : t(`admin.settings.texts.messages.${id}`)
  const preview = activity ? null : codes(raw(email ? `${id}_body` : keys.includes('after_intro') ? 'after_intro' : keys[0]))

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4 py-1.5">
        {/* The white halo hides the timeline's line behind the dot. */}
        <span
          className={cx(
            'relative grid size-10 shrink-0 place-items-center rounded-full transition-colors',
            on ? 'bg-brand-700 text-white shadow-[0_0_0_5px_var(--panel)]' : 'bg-panel text-ghost shadow-[0_0_0_5px_var(--panel),inset_0_0_0_1.5px_var(--edge)]',
          )}
        >
          <Icon name={icon} className="size-4.25" strokeWidth={1.8} />
        </span>
        <div className={cx('flex min-w-0 flex-1 items-center gap-3.5 rounded-[18px] bg-surface px-3.5 py-3 transition-opacity', !on && 'opacity-60')}>
          <span className="w-42.5 shrink-0 text-xs leading-[1.4] text-muted">{when}</span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className={cx('text-[15px] text-ink', activity && 'truncate')}>{title}</span>
            {preview && <span className="truncate text-xs text-soft">{preview}</span>}
          </span>
          {onToggle ? (
            <Switch id={`email-message-${id}-on`} on={on} label={title} onChange={onToggle} />
          ) : (
            !activity && <Badge size="sm" look="panel">{t('admin.settings.texts.alwaysSent')}</Badge>
          )}
          <IconButton id={`email-message-${id}-edit`} icon="pencil" label={t('shared.common.edit')} title size={8.5} look="panel" iconClassName="size-3.75" onClick={() => setOpen(drafts)} />
        </div>
      </div>
      <Modal id="email-message-messages"
        open={!!open}
        onClose={cancel}
        size="wide"
        title={activity ? raw(id) : t(`admin.settings.texts.messages.${id}`)}
        description={when}
        footer={
          <>
            <Button id="email-message-cancel" variant="outline" onClick={cancel}>
              {t('shared.common.cancel')}
            </Button>
            <Button id="email-message-done" onClick={() => setOpen(null)}>{t('shared.common.done')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {keys.map((k) => (
            <TextEditor
              key={k}
              label={t(`admin.settings.texts.parts.${activity ? 'line' : partOf(k)}`)}
              value={drafts[k]}
              allowed={message.placeholders}
              onChange={(v) => setDrafts((d) => ({ ...d, [k]: v }))}
            />
          ))}
          {(email || id === 'calendar_title') && (
            <div className="grid gap-2.5 lg:grid-cols-2">
              {['en', 'ar'].map((lang) => (
                <div key={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang} className="flex min-w-0 flex-col gap-2 rounded-2xl bg-panel px-4 py-3.5 ring-1 ring-line ring-inset">
                  <span className="text-[11px] tracking-[0.1em] text-muted uppercase">{translate(lang, 'admin.settings.texts.preview')}</span>
                  <span className="text-sm font-medium text-ink">{say(email ? `${id}_subject` : id, lang)}</span>
                  {email && <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-soft [overflow-wrap:anywhere]">{say(`${id}_body`, lang)}</p>}
                </div>
              ))}
            </div>
          )}
          {email && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex-1 text-[13px] text-muted">{t(dirty ? 'admin.settings.texts.saveFirst' : 'admin.settings.texts.testHint')}</span>
              {['en', 'ar'].map((lang) => (
                <Button id={`email-message-run-${lang}`} key={lang} variant="soft" size="sm" disabled={dirty} onClick={() => run(() => sendTestEmail(id, lang), t('admin.settings.texts.testSent'))}>
                  <Icon name="send" className="size-3.5" strokeWidth={1.8} />
                  {t(lang === 'ar' ? 'admin.settings.texts.testAr' : 'admin.settings.texts.testEn')}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

/** One text in English and Arabic; a chip puts its {word} where the cursor was in the box used last. */
function TextEditor({ label, value, allowed, onChange }) {
  const { t } = useLang()
  const boxes = { en: useRef(null), ar: useRef(null) }
  const [last, setLast] = useState('en')
  const bad = unknownPlaceholders(`${value.en} ${value.ar}`, allowed)
  const rows = Math.min(10, Math.max(2, value.en.split('\n').length + 1))

  const insert = (word) => {
    const box = boxes[last].current
    const text = value[last]
    const from = box?.selectionStart ?? text.length
    const to = box?.selectionEnd ?? text.length
    onChange({ ...value, [last]: `${text.slice(0, from)}{${word}}${text.slice(to)}` })
    requestAnimationFrame(() => {
      box?.focus()
      box?.setSelectionRange(from + word.length + 2, from + word.length + 2)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] text-soft">{label}</span>
      <div className="grid gap-2.5 lg:grid-cols-2">
        {['en', 'ar'].map((lang) => (
          <Textarea id={`email-message-on-change-${lang}`}
            key={lang}
            ref={boxes[lang]}
            rows={rows}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            aria-label={t(lang === 'ar' ? 'admin.settings.texts.boxAr' : 'admin.settings.texts.boxEn', { part: label })}
            value={value[lang]}
            error={bad.length > 0}
            onFocus={() => setLast(lang)}
            onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {allowed.map((w) => (
          <Button variant="bare" id={`email-message-cant-fill-${w}`}
            key={w}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insert(w)}
            className="h-7 rounded-full bg-panel px-2.5 text-xs text-brand-800 ring-1 ring-line transition ring-inset hover:bg-brand-100"
          >
            {`{${w}}`}
          </Button>
        ))}
      </div>
      {bad.length > 0 && <p className="text-xs text-danger-ink">{t('admin.settings.texts.cantFill', { words: bad.map((w) => `{${w}}`).join(t('shared.common.listJoin')) })}</p>}
    </div>
  )
}
