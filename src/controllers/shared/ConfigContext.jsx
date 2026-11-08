import { createContext, useContext, useEffect, useMemo } from 'react'
import { useAuth } from './AuthContext.jsx'
import { useLang } from './LangContext.jsx'
import { brandOf, loadConfig } from '../../models/data/settings.js'
import { useRows } from './useRows.js'

const ConfigContext = createContext(null)
/* Whether the config is loading, ready, failed, or the session ended (RequireConfig shows the screen). */
const ConfigStatus = createContext(null)

/**
 * Settings, option lists, texts, holidays and the team, loaded once after sign-in. Every page and
 * shared component reads them from here, so no list or number lives in the code.
 */
export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used inside <ConfigProvider>')
  return ctx
}

/** { status: 'loading' | 'ready' | 'error' | 'ended', error, reload }, for the guard that shows the screens. */
export function useConfigStatus() {
  return useContext(ConfigStatus)
}

export function ConfigProvider({ children }) {
  const { data, error, reload } = useRows(loadConfig, 'config')
  const { endSession } = useAuth()
  const { lang } = useLang()
  const ended = error?.sessionEnded

  useEffect(() => {
    if (ended) endSession(error)
  }, [ended, error, endSession])

  const app = data?.settings.company.app_name
  useEffect(() => {
    if (app) document.title = app
  }, [app])

  const value = useMemo(() => {
    if (!data) return null
    const people = new Map(data.team.map((p) => [p.id, p]))
    return {
      ...data,
      /** The app's, the product's and the company's names (Settings → Company). */
      brand: brandOf(data.settings.company, lang),
      reload,
      /** Only the options still on, for pickers on new members. */
      active: (list) => (data.lists[list] ?? []).filter((o) => o.active),
      /** An option's name in the reader's language (Arabic falls back to English), or its key when it no longer exists. */
      label: (list, key) => {
        const o = data.lists[list]?.find((x) => x.key === key)
        return (lang === 'ar' && o?.labelAr) || o?.label || key
      },
      /** An option's extra words in the reader's language: `field` of its meta, or `field`_ar for Arabic. */
      meta: (list, key, field) => {
        const m = data.lists[list]?.find((x) => x.key === key)?.meta ?? {}
        return (lang === 'ar' && m[`${field}_ar`]) || m[field] || ''
      },
      option: (list, key) => data.lists[list]?.find((o) => o.key === key),
      person: (id) => people.get(id) ?? null,
    }
  }, [data, reload, lang])

  const status = ended ? 'ended' : error ? 'error' : value ? 'ready' : 'loading'
  const state = useMemo(() => ({ status, error, reload }), [status, error, reload])
  return (
    <ConfigStatus.Provider value={state}>
      <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
    </ConfigStatus.Provider>
  )
}
