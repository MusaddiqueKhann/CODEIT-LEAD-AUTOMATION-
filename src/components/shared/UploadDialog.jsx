import { useRef, useState } from 'react'
import Icon from '../Icon.jsx'
import { FILE_TYPES, acceptFor, fileSize } from '../../models/rules/members.js'
import { TONES } from '../tones.js'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { Button, Modal, cx } from '../ui/index.js'

/** Drop or pick one file for a document, of its `type` (pdf, image, excel, any). UI only: the file stays in the browser. */
export function UploadDialog({ label, type, current, onClose, onSave }) {
  const { t } = useLang()
  const [file, setFile] = useState(current ?? null)
  const [drag, setDrag] = useState(false)
  const input = useRef(null)
  // `file` keeps the File itself, for the upload on save.
  const take = (f) => f && setFile({ name: f.name, size: f.size, type: f.type, url: URL.createObjectURL(f), file: f })

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={t('shared.upload.title')}
      description={label}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button disabled={!file} onClick={() => onSave(file)}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <input
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
            <p className="text-xs text-muted">{t('shared.upload.uploaded', { size: fileSize(file.size) })}</p>
          </div>
          <Button
            variant="bare"
            onClick={() => setFile(null)}
            className="h-9 rounded-[10px] bg-panel px-3.5 text-[13px] text-ink ring-1 ring-line transition ring-inset hover:bg-surface"
          >
            {t('shared.documents.remove')}
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
            <span className="pointer-events-none text-[15px] text-ink">{t(drag ? 'shared.upload.drop' : 'shared.upload.drag')}</span>
            {!drag && (
              <span className="flex items-center gap-2 text-sm text-muted">
                {t('shared.upload.or')}
                <Button
                  variant="bare"
                  onClick={() => input.current.click()}
                  className="h-9 rounded-[10px] bg-panel px-3.5 text-sm text-brand-700 ring-1 ring-line transition ring-inset hover:bg-surface"
                >
                  {t('shared.upload.choose')}
                </Button>
              </span>
            )}
          </div>
          <p className="text-center text-xs text-muted">{t(`shared.upload.types.${type in FILE_TYPES ? type : 'default'}`)}</p>
        </div>
      )}
    </Modal>
  )
}
