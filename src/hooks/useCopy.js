import { useCallback } from 'react'
import { useToast } from '../context/ToastContext.jsx'

/**
 * Copies text to the clipboard and reports the result through the toast stack.
 *
 * The failure path is real, not defensive padding: navigator.clipboard is
 * undefined on any non-HTTPS origin that isn't localhost, so a device testing
 * the prototype over a LAN address hits it. Silently doing nothing there would
 * look like a dead button, so it falls back to telling the user the value.
 */
export function useCopy() {
  const { toast } = useToast()

  return useCallback(
    async (text, label = 'Copied') => {
      try {
        await navigator.clipboard.writeText(text)
        toast(`${label} to clipboard.`)
      } catch {
        toast(`Couldn’t copy automatically — the value is ${text}`, 'warn')
      }
    },
    [toast],
  )
}
