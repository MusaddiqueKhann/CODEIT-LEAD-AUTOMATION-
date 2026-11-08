import { useRef, useState } from 'react'
import Icon from '../Icon.jsx'
import { fileSize } from '../../models/rules/format.js'
import { FILE_TYPES, acceptFor } from '../../models/rules/members.js'
import { TONES } from '../tones.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'
import { Notice } from '../ui/Notice.jsx'
import { cx } from '../cx.js'

/** Drop or pick one file for a document, of its `type` (pdf, image, excel, any). UI only: the file stays in the browser. */
export function UploadDialog({ label, type, current, onClose, onSave }) {
  const { t } = useLang()
  const [file, setFile] = useState(current ?? null)
  const [drag, setDrag] = useState(false)
  const input = useRef(null)
  const mb = useConfig().settings.maxUploadMb
  const [tooBig, setTooBig] = useState(false)
  // `file` keeps the File itself, for the upload on save. One over the limit (Company settings → Timing) is turned away here.
  const take = (f) => {
    if (!f) return
    setTooBig(f.size > mb * 1048576)
    if (f.size <= mb * 1048576) setFile({ name: f.name, size: f.size, type: f.type, url: URL.createObjectURL(f), file: f })
  }

  return (
    <Modal id="upload-dialog-title"
      open
      onClose={onClose}
      size="lg"
      title={t('shared.components.upload.title')}
      description={label}
      footer={
        <>
          <Button id="upload-dialog-cancel" variant="outline" onClick={onClose}>
            {t('shared.common.cancel')}
          </Button>
          <Button id="upload-dialog-save" disabled={!file} onClick={() => onSave(file)}>
            {t('shared.common.save')}
          </Button>
        </>
      }
    >
      <input className="ui-upload-dialog__file" id="upload-dialog-file"
        ref={input}
        type="file"
        accept={acceptFor(type)}
        hidden
        onChange={(e) => {
          take(e.target.files[0])
          e.target.value = ''
        }}
      />
      {file ? (
        <div className={cx('flex flex-wrap items-center gap-3 rounded-[14px] p-3.5 ring-1 ring-success/30 ring-inset', TONES.success.fill)}>
          <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl bg-panel text-[11px] font-medium', TONES.success.text)}>
            {file.name.split('.').pop().slice(0, 4).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{file.name}</p>
            <p className="text-xs text-muted">{t('shared.components.upload.uploaded', { size: fileSize(file.size) })}</p>
          </div>
          <Button id="upload-dialog-remove"
            variant="bare"
            onClick={() => setFile(null)}
            className="h-9 rounded-[10px] bg-panel px-3.5 text-[13px] text-ink ring-1 ring-line transition ring-inset hover:bg-surface"
          >
            {t('shared.components.documents.remove')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              take(e.dataTransfer.files[0])
            }}
            className={cx(
              'flex h-60 flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed text-center transition',
              drag ? 'border-brand-700 bg-brand-50' : 'border-brand-200 bg-tint',
            )}
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-panel text-brand-700 shadow-sm">
              <Icon name="upload" className="size-6" strokeWidth={1.8} />
            </span>
            <span className="pointer-events-none text-[15px] text-ink">{t(drag ? 'shared.components.upload.drop' : 'shared.components.upload.drag')}</span>
            {!drag && (
              <span className="flex items-center gap-2 text-sm text-muted">
                {t('shared.components.upload.or')}
                <Button id="upload-dialog-choose"
                  variant="bare"
                  onClick={() => input.current.click()}
                  className="h-9 rounded-[10px] bg-panel px-3.5 text-sm text-brand-700 ring-1 ring-line transition ring-inset hover:bg-surface"
                >
                  {t('shared.components.upload.choose')}
                </Button>
              </span>
            )}
          </div>
          <p className="text-center text-xs text-muted">{t(`shared.components.upload.types.${type in FILE_TYPES ? type : 'default'}`, { mb })}</p>
          {tooBig && <Notice role="alert">{t('shared.errors.file_too_big', { mb })}</Notice>}
        </div>
      )}
    </Modal>
  )
}
