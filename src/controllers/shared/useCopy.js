import { useCallback } from 'react'
import { useLang } from './LangContext.jsx'
import { useToast } from './ToastContext.jsx'

/**
 * Copies text to the clipboard and toasts `done` (the whole sentence, e.g. "Password copied to clipboard.").
 *
 * The failure path is real, not defensive padding: navigator.clipboard is
 * undefined on any non-HTTPS origin that isn't localhost, so a device testing
 * the prototype over a LAN address hits it. Silently doing nothing there would
 * look like a dead button, so it falls back to telling the user the value.
 */
export function useCopy() {
  const { toast } = useToast()
  const { t } = useLang()

  return useCallback(
    async (text, done) => {
      try {
        await navigator.clipboard.writeText(text)
        toast(done)
      } catch {
        toast(t('shared.common.copyFailed', { value: text }), 'warn')
      }
    },
    [toast, t],
  )
}
