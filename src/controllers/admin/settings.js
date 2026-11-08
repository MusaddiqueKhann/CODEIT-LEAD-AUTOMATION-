import { emailKeySet, listSettingsLog } from '../../models/data/settings.js'
import { useConfig } from '../shared/ConfigContext.jsx'
import { useRows } from '../shared/useRows.js'

/** Settings → History: every change, newest first; reads again whenever the settings reload. */
export function useSettingsLog() {
  const { loadedAt } = useConfig()
  return useRows(listSettingsLog, `history:${loadedAt}`)
}

/** Whether the email service key is set (the key itself never comes back). */
export const useEmailKeySet = () => useRows(emailKeySet, 'email-key')

/* Company settings' saves. */
export { removeHoliday, saveOption, saveText, sendTestEmail, setEmailKey, setHoliday, updateSettings } from '../../models/data/settings.js'
