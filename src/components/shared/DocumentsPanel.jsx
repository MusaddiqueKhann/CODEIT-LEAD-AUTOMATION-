import { useState } from 'react'
import Icon from '../Icon.jsx'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { byReadiness, docState, dueOn, extOf, fileSize, inDaysLabel } from '../../models/rules/members.js'
import { TONES } from '../tones.js'
import { Button, ConfirmDialog, cx } from '../ui/index.js'
import { FileViewer } from './FileViewer.jsx'
import { UploadDialog } from './UploadDialog.jsx'

/**
 * Every file the member sends, in two groups: To send (due soonest first, each with Upload and
 * the date they'll send it by) and Uploaded (View, Replace, Remove). The page owns `files`
 * (key → { name, size, url?, path? }) and `due` (key → days); `onRemove(key)` drops a file after a
 * confirm. `readOnly` leaves only View. `openFile(file)` resolves a link for a stored file (path,
 * no url). With no documents it shows `empty`, the line saying why.
 */
export function DocumentsPanel({ keys, files, onFile, onRemove, due, onDue, readOnly = false, openFile, empty }) {
  const { label, active, meta } = useConfig()
  const { t } = useLang()
  const choices = active('due_choice')
  const [menu, setMenu] = useState(null)
  const [uploading, setUploading] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const order = [...keys].sort(byReadiness(docState(files, due, keys)))
  const toSend = order.filter((k) => !files[k])
  const sent = order.filter((k) => files[k])

  if (keys.length === 0) return <NoFiles>{empty}</NoFiles>
  return (
    <div className="flex flex-col gap-2">
      {toSend.length > 0 && <Group className={TONES.warn.text}>{t('shared.documents.toSend', { n: toSend.length })}</Group>}
      {toSend.map((k) => (
        <ToSendRow
          key={k}
          label={label('document', k)}
          optional={!!meta('document', k, 'optional')}
          choices={choices}
          readOnly={readOnly}
          due={due[k]}
          open={menu === k}
          onMenu={() => setMenu(menu === k ? null : k)}
          onDue={(days) => {
            onDue(k, days)
            setMenu(null)
          }}
          onUpload={() => {
            setMenu(null)
            setUploading(k)
          }}
        />
      ))}
      {sent.length > 0 && <Group className={cx(TONES.success.text, toSend.length > 0 && 'pt-3')}>{t('shared.documents.uploaded', { n: sent.length })}</Group>}
      {sent.map((k) => (
        <div key={k} className="flex flex-wrap items-center gap-3.5 rounded-[20px] px-4 py-2.5 ring-1 ring-line ring-inset">
          <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-success-bg text-[10px] tracking-[0.06em] text-success-ink">
            {extOf(files[k].name)}
          </span>
          <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-ink">{label('document', k)}</span>
            <span className="truncate text-[13px] text-faint">
              {files[k].name}
              {files[k].size != null && ` · ${fileSize(files[k].size)}`}
            </span>
          </span>
          <div className="flex gap-2">
            <Button variant="soft" onClick={() => setViewing(k)}>
              <Icon name="eye" className="size-4" strokeWidth={1.8} />
              {t('shared.documents.view')}
            </Button>
            {!readOnly && (
              <Button variant="soft" onClick={() => setUploading(k)}>
                <Icon name="upload" className="size-4" strokeWidth={1.8} />
                {t('shared.documents.replace')}
              </Button>
            )}
            {!readOnly && onRemove && (
              <Button variant="soft" aria-label={t('shared.documents.removeLabel', { name: label('document', k) })} onClick={() => setRemoving(k)}>
                <Icon name="close" className="size-4" strokeWidth={1.8} />
                {t('shared.documents.remove')}
              </Button>
            )}
          </div>
        </div>
      ))}

      {uploading && (
        <UploadDialog
          label={label('document', uploading)}
          type={meta('document', uploading, 'type')}
          current={files[uploading]}
          onClose={() => setUploading(null)}
          onSave={(f) => {
            onFile(uploading, f)
            setUploading(null)
          }}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => onRemove(removing)}
        title={removing ? t('shared.documents.removeTitle', { name: label('document', removing) }) : ''}
        description={t(removing && files[removing]?.path ? 'shared.documents.removeStored' : 'shared.documents.removeDraft')}
        confirmLabel={t('shared.documents.remove')}
      />
      {viewing && (
        <FileViewer
          items={sent.map((k) => ({ key: k, label: label('document', k), file: files[k] }))}
          start={viewing}
          openFile={openFile}
          onClose={() => setViewing(null)}
          onReplace={
            readOnly
              ? null
              : (k) => {
                  setViewing(null)
                  setUploading(k)
                }
          }
        />
      )}
    </div>
  )
}

/** No documents yet: what will appear here, over three placeholder files. */
function NoFiles({ children }) {
  const { t } = useLang()
  return (
    <div className="flex flex-wrap items-center gap-4.5 rounded-[22px] bg-surface-2 p-4.5">
      <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-panel text-brand-700 shadow-[0_8px_18px_-12px_rgba(30,50,80,0.35)]">
        <Icon name="file" className="size-5" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-50 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{t('shared.documents.noFiles')}</span>
        <span className="text-[13px] leading-normal text-muted">{children}</span>
      </span>
      <div aria-hidden="true" className="grid flex-[1_1_100%] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2 opacity-90">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex h-16 items-center gap-2.5 rounded-2xl bg-panel px-3 ring-1 ring-line ring-inset">
            <span className="size-9 shrink-0 rounded-[10px] bg-surface" />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="h-2 w-[70%] rounded bg-line" />
              <span className="h-1.5 w-[45%] rounded bg-line-soft" />
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Group({ className, children }) {
  return <span className={cx('px-1 text-[13px] tracking-[0.1em] uppercase', className)}>{children}</span>
}

/** A file still to come: Upload, and the date they'll send it by (the line under its name sets it). */
function ToSendRow({ label, optional, choices, readOnly, due, open, onMenu, onDue, onUpload }) {
  const { label: name } = useConfig()
  const { t } = useLang()
  const [custom, setCustom] = useState('')
  const days = Number(custom)
  const when =
    due != null
      ? t('shared.documents.due', { date: dueOn(due), when: inDaysLabel(choices, due, t, (c) => name('due_choice', c.key)) })
      : t(readOnly ? 'shared.documents.notAdded' : 'shared.documents.noDate')

  return (
    <div className={cx('relative flex flex-wrap items-center gap-3.5 rounded-[20px] bg-warn-wash px-4 py-3.5', open && 'z-10')}>
      <span className={cx('grid size-11 shrink-0 place-items-center rounded-[14px] bg-panel', TONES.warn.text)}>
        <Icon name="file" className="size-4" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-[1_1_200px] flex-col items-start gap-0.5">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
          {label}
          {/* Asked for, but it doesn't hold up Transfer (Settings → Required documents). */}
          {optional && <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] font-normal text-muted">{t('shared.documents.optional')}</span>}
        </span>
        {readOnly ? (
          <span className={cx('text-[13px]', TONES.warn.text)}>{when}</span>
        ) : (
          <Button
            variant="bare"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={onMenu}
            className={cx('flex items-center gap-1 text-start text-[13px] underline-offset-2 hover:underline', TONES.warn.text)}
          >
            {when}
            <Icon name="chevronDown" className="size-3" strokeWidth={2.2} />
          </Button>
        )}
      </span>
      {!readOnly && (
        <Button onClick={onUpload}>
          <Icon name="upload" className="size-4" strokeWidth={1.8} />
          {t('shared.documents.upload')}
        </Button>
      )}

      {open && (
        <div role="menu" className="absolute top-[calc(100%-6px)] start-18 z-20 flex w-60 animate-drop flex-col gap-0.5 rounded-[14px] bg-panel p-1.5 shadow-pop">
          <span className="px-2.5 pt-1.5 pb-1 text-xs text-muted">{t('shared.documents.sendIn')}</span>
          {choices.map((r) => (
            <MenuItem key={r.key} on={due === r.meta.days} onClick={() => onDue(r.meta.days)}>
              <span>{name('due_choice', r.key)}</span>
              <span className="text-xs opacity-75">{dueOn(r.meta.days)}</span>
            </MenuItem>
          ))}
          <div className="mt-1 flex flex-col gap-1.5 border-t border-line-soft px-1.5 pt-2.5 pb-1">
            <span className="text-xs text-muted">{t('shared.documents.custom')}</span>
            <div className="flex items-center gap-1.5">
              <label className="flex h-10 min-w-0 flex-1 items-center gap-1.5 rounded-[10px] bg-surface-2 px-2.5">
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  inputMode="numeric"
                  placeholder="10"
                  aria-label={t('shared.documents.dueInDays')}
                  className="w-full min-w-0 bg-transparent text-sm text-ink outline-none"
                />
                <span className="text-[13px] text-muted">{t('shared.documents.days')}</span>
              </label>
              <Button
                variant="bare"
                disabled={!days}
                onClick={() => onDue(days)}
                className="h-10 rounded-[10px] bg-brand-700 px-3.5 text-sm text-white transition disabled:bg-line"
              >
                {t('shared.documents.set')}
              </Button>
            </div>
            <span className={cx('min-h-4 text-xs', TONES.warn.text)}>{days > 0 && dueOn(days)}</span>
          </div>
          {due != null && (
            <Button
              variant="bare"
              onClick={() => onDue(null)}
              className="h-9 rounded-[10px] px-2.5 text-start text-[13px] text-muted transition hover:bg-surface hover:text-ink"
            >
              {t('shared.documents.clear')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function MenuItem({ on, ...rest }) {
  return (
    <Button
      variant="bare"
      role="menuitem"
      className={cx(
        'flex h-10 items-center justify-between gap-2.5 rounded-[10px] px-3 text-start text-sm whitespace-nowrap transition',
        on ? cx(TONES.warn.fill, TONES.warn.text) : 'text-ink hover:bg-surface',
      )}
      {...rest}
    />
  )
}
