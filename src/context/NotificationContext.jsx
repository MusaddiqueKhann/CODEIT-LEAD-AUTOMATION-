import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { initialNotifications } from '../data/mockData.js'

const NotificationContext = createContext(null)

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>')
  return ctx
}

let seq = 0

/**
 * The notification log — mirrors what the live system would send by email, so a
 * client can always reconcile "did CODE actually tell me that?" in one place.
 *
 * Sits ABOVE BookingProvider in the tree, because booking actions call notify()
 * and a provider can only consume what is already above it. That ordering is
 * the reason this is its own file rather than living inside the booking slice.
 */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const notify = useCallback(({ kind, title, body }) => {
    setNotifications((current) => [
      { id: `n-new-${++seq}`, kind, title, body, at: 'Just now', read: false },
      ...current,
    ])
  }, [])

  const markRead = useCallback((id) => {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((current) => current.map((n) => (n.read ? n : { ...n, read: true })))
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const value = useMemo(
    () => ({ notifications, unreadCount, notify, markRead, markAllRead }),
    [notifications, unreadCount, notify, markRead, markAllRead],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
