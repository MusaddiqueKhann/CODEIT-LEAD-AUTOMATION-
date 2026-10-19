import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon.jsx'
import { Button } from './Button.jsx'
import { cx } from '../../lib/cx.js'

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

/**
 * A centred dialog, portalled to <body>.
 *
 * The portal is not cosmetic: rendered in place, the dialog would inherit any
 * ancestor `overflow-hidden` or transform — and the content card in AppShell
 * has a radius that clips — so a modal opened from inside a Card would be cut
 * off at the card's edge.
 *
 * Focus moves to the panel on open and returns to the trigger on close, which
 * is what keyboard users need to not be dumped at the top of the document.
 */
export function Modal({ open, onClose, title, description, footer, size = 'md', children }) {
  const panelRef = useRef(null)
  const restoreRef = useRef(null)

  useEffect(() => {
    if (!open) return

    restoreRef.current = document.activeElement
    panelRef.current?.focus()

    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)

    /* Locking the body prevents the page behind from scrolling under the
       dialog. The previous value is restored rather than assuming '' — nested
       or fast-cycling modals would otherwise clear a lock they didn't set. */
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      restoreRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          'relative w-full rounded-2xl border border-line bg-panel outline-none',
          // Popovers and dialogs keep a shadow where the cards no longer do —
          // they float over content rather than sitting in the layout, so the
          // border alone would let them blend into whatever is behind them.
          'shadow-xl shadow-black/10',
          WIDTHS[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="text-[17px] font-bold tracking-tight text-ink">{title}</h2>
            {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink"
          >
            <Icon name="close" className="size-4.5" />
          </button>
        </div>

        {children && <div className="px-6 pt-5">{children}</div>}

        <div className="flex justify-end gap-3 px-6 pt-6 pb-6">{footer}</div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * The common case: a destructive action needing an "are you sure".
 * `tone` drives the confirm button, so a cancel-booking dialog reads red and a
 * neutral one reads brand without the call site restating it.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Never mind',
  tone = 'danger',
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
