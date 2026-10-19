import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

let seq = 0

/**
 * Transient status messages.
 *
 * Split out of the old single AppContext because toasts churn hardest — one
 * fires on nearly every action and again four seconds later when it expires.
 * While every slice shared a provider, each of those renders invalidated the
 * context value and re-rendered every consumer in the app, including the whole
 * booking list. Isolating it means a toast now re-renders the toast stack only.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  /* Pending expiry timers, so unmount doesn't leave setState callbacks queued
     against a dead tree. The old implementation never cleared them. */
  const timers = useRef(new Map())

  const dismissToast = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, tone = 'success') => {
      const id = ++seq
      setToasts((current) => [...current, { id, message, tone }])
      timers.current.set(id, setTimeout(() => dismissToast(id), 4000))
      return id
    },
    [dismissToast],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const value = useMemo(() => ({ toasts, toast, dismissToast }), [toasts, toast, dismissToast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
