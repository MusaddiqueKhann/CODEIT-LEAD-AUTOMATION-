import { useEffect } from 'react'
import { useLang } from './LangContext.jsx'
import { useToast } from './ToastContext.jsx'
import { alertPath, onAlertsChange } from '../../models/data/alerts.js'
import { pick } from '../../content/index.js'

/** A new alert, while the app is open, also shows as a toast with Open, in the reader's language. */
export function useAlertToasts(personId) {
  const { toast } = useToast()
  const { lang, t } = useLang()
  useEffect(
    () =>
      onAlertsChange(personId, async (e) => {
        if (e.eventType === 'INSERT') toast(pick(lang, e.new.text, e.new.text_ar), 'brand', { label: t('common.open'), to: await alertPath(e.new) })
      }),
    [personId, toast, lang, t],
  )
}
