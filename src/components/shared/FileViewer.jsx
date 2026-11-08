import { useEffect, useState } from 'react'
import { IconButton } from '../ui/IconButton.jsx'
import { createPortal } from 'react-dom'
import Icon from '../Icon.jsx'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { fileSize, formatStamp } from '../../models/rules/format.js'
import { extOf } from '../../models/rules/members.js'
import { initials } from '../../models/rules/time.js'
import { Avatar } from '../ui/Avatar.jsx'
import { Button } from '../ui/Button.jsx'
import { cx } from '../cx.js'

const isImage = (file) => (file.type ? file.type.startsWith('image/') : /\.(png|jpe?g|gif|webp)$/i.test(file.name))

/**
 * A member's files, full screen like a chat's photo viewer: the page dims, the file sits in the
 * middle, the arrows (or ← →) step through `items`, and the strip below jumps to any of them.
 * `items` are { key, label, file }; it opens on `start`. A stored file (a path, no url) gets a
 * short-lived link from `openFile`; one with neither shows a sample page. `onReplace(key)` is
 * for whoever may change the files.
 */
export function FileViewer({ items, start, openFile, onClose, onReplace }) {
  const { person } = useConfig()
  const { t, dir } = useLang()
  const [i, setI] = useState(() => Math.max(0, items.findIndex((it) => it.key === start)))
  const [urls, setUrls] = useState({}) // key → link, or null when the file isn't stored
  const { key, label, file } = items[i]
  const stored = !file.url && file.path && openFile
  const url = file.url ?? urls[key]
  const by = person(file.by)?.name
  const go = (n) => setI(Math.min(Math.max(n, 0), items.length - 1))

  // A link for every stored file, so the strip shows pictures too. Links last 5 minutes, longer than a look.
  useEffect(() => {
    let live = true
    for (const it of items) {
      if (!it.file.url && it.file.path && openFile) openFile(it.file).then((u) => live && setUrls((m) => ({ ...m, [it.key]: u })))
    }
    return () => {
      live = false
    }
  }, [items, openFile])

  useEffect(() => {
    // The arrow keys follow the reading direction: in Arabic, ← is the next file.
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === forward) setI((n) => Math.min(n + 1, items.length - 1))
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setI((n) => Math.max(n - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, items.length, dir])

  const download = async () => {
    const link = await openFile(file, true)
    if (link) window.location.assign(link)
  }

  // On <body>: a card's rise animation (a transform) would otherwise box in `fixed`.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-70 flex flex-col bg-black/75 backdrop-blur-sm">
      <div className="flex items-center gap-3.5 px-6 py-5 sm:px-8">
        {by ? (
          <Avatar initials={initials(by)} size="md" className="size-11 text-sm" />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-700 text-white">
            <Icon name="file" className="size-5" strokeWidth={1.8} />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base text-white">{label}</span>
          <span className="truncate text-[13px] text-white/65">
            {[file.name, by, file.at ? formatStamp(file.at) : file.size != null && fileSize(file.size)].filter(Boolean).join(' · ')}
          </span>
        </div>
        {(file.url || (stored && url)) &&
          (file.url ? (
            <IconButton id="file-viewer-download" icon="download" label={t('shared.components.viewer.download')} title href={file.url} size={13} look="glass" iconClassName="size-5" download={file.name} />
          ) : (
            <IconButton id="file-viewer-download-2" icon="download" label={t('shared.components.viewer.download')} title size={13} look="glass" iconClassName="size-5" onClick={download} />
          ))}
        {onReplace && (
          <IconButton id="file-viewer-replace" icon="upload" label={t('shared.components.viewer.replace')} title size={13} look="glass" iconClassName="size-5" onClick={() => onReplace(key)} />
        )}
        <IconButton id="file-viewer-close" icon="close" label={t('shared.common.close')} title size={13} look="glass" iconClassName="size-5" autoFocus onClick={onClose} />
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-6 sm:px-28" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {items.length > 1 && (
          <>
            <IconButton id="file-viewer-previous" icon="chevronLeft" label={t('shared.components.viewer.previous')} size={14} look="glass" iconClassName="size-5" strokeWidth={2} disabled={i === 0} onClick={() => go(i - 1)} className="absolute start-6 top-1/2 z-10 -translate-y-1/2" />
            <IconButton id="file-viewer-next" icon="chevronRight" label={t('shared.components.viewer.next')} size={14} look="glass" iconClassName="size-5" strokeWidth={2} disabled={i === items.length - 1} onClick={() => go(i + 1)} className="absolute end-6 top-1/2 z-10 -translate-y-1/2" />
          </>
        )}
        <div key={key} className="flex h-full max-h-full max-w-full animate-rise items-center justify-center">
          {stored && url === undefined && <span className="text-sm text-white/60">{t('shared.components.viewer.opening')}</span>}
          {url && isImage(file) && <img src={url} alt={label} className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" />}
          {url && !isImage(file) && <iframe src={url} title={label} className="h-full w-[min(64rem,calc(100vw-14rem))] rounded-2xl bg-panel shadow-2xl" />}
          {!url && !(stored && url === undefined) && (
            <div className="flex aspect-[0.72] h-full max-h-180 max-w-full flex-col gap-3 rounded-2xl bg-panel p-10 shadow-2xl">
              <span className="h-3.5 w-30 rounded-full bg-line" />
              <span className="mt-4 text-xl tracking-tight text-ink">{label}</span>
              {[70, 92, 84, 60, 88, 76].map((w) => (
                <span key={w} className="h-2.5 rounded-full bg-line-soft" style={{ width: `${w}%` }} />
              ))}
              <span className="mt-auto text-center text-xs text-muted">{t('shared.components.viewer.missing')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="scrollbar-slim flex justify-center gap-2.5 overflow-x-auto px-6 pt-5 pb-6">
        {items.map((it, n) => {
          const link = it.file.url ?? urls[it.key]
          return (
            <Button id={`file-viewer-go-${it.key}`}
              key={it.key}
              variant="bare"
              aria-label={it.label}
              aria-current={n === i}
              title={it.label}
              onClick={() => go(n)}
              className={cx(
                'grid h-14 w-19 shrink-0 place-items-center overflow-hidden rounded-lg bg-panel transition',
                n === i ? 'ring-2 ring-white' : 'opacity-45 hover:opacity-80',
              )}
            >
              {link && isImage(it.file) ? (
                <img src={link} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-0.5 text-faint">
                  <Icon name="file" className="size-4" strokeWidth={1.8} />
                  <span className="text-[9px] tracking-[0.08em]">{extOf(it.file.name)}</span>
                </span>
              )}
            </Button>
          )
        })}
      </div>
    </div>,
    document.body,
  )
}
