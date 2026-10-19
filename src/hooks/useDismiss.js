import { useEffect, useRef } from 'react'

/**
 * Closes a popover on outside click or Escape. Returns the ref to put on the
 * element that counts as "inside".
 *
 * `onClose` is held in a ref so a fresh inline callback each render doesn't
 * re-bind the document listeners — otherwise every parent render would tear
 * down and re-add both listeners, and a mousedown landing in that gap would be
 * missed.
 */
export function useDismiss(open, onClose) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return

    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) closeRef.current()
    }
    const onKey = (e) => e.key === 'Escape' && closeRef.current()

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return ref
}
