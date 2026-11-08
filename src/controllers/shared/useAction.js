import { useCallback, useState } from 'react'
import { useLang } from './LangContext.jsx'
import { useToast } from './ToastContext.jsx'

/**
 * Runs a server action: shows its success line (or the server's refusal) as a toast, then calls
 * `after` (usually a reload). `run` resolves true when it worked, so a dialog knows to close.
 * `success` may be a function of what `fn` returned.
 */
export function useAction(after) {
  const { toast } = useToast()
  const { errorText } = useLang()
  const [busy, setBusy] = useState(false)

  const run = useCallback(
    async (fn, success) => {
      setBusy(true)
      try {
        const result = await fn()
        if (success) toast(typeof success === 'function' ? success(result) : success)
        after?.()
        return true
      } catch (err) {
        toast(errorText(err), 'danger')
        return false
      } finally {
        setBusy(false)
      }
    },
    [toast, after, errorText],
  )

  return { run, busy }
}
