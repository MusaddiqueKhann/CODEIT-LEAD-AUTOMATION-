import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { setMyLanguage } from '../../models/data/auth.js'
import { setDateLanguage } from '../../models/rules/format.js'
import { refusalText } from '../../models/rules/refusal.js'
import { translate } from '../../content/index.js'

const LangContext = createContext(null)
/* A key with no words shows itself, and says so in the console while developing. */
const missing = (key) => {
  if (import.meta.env.DEV) console.warn(`No words for "${key}"`)
  return key
}
const KEY = 'lead-codeit:lang'
const stored = () => {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
const store = (lang) => {
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    /* private window: the choice lasts this visit */
  }
}

/** { lang, dir, t, errorText, setLang } for the app's language. */
export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>')
  return ctx
}

/**
 * The app's language: the signed-in person's (My profile), else the one last picked in this
 * browser. It sets <html lang dir> for right-to-left Arabic, and the whole app draws again when
 * it changes, so every word and date follows. The customer page sets its own language instead.
 */
export function LangProvider({ children }) {
  const { profile, reloadProfile } = useAuth()
  const [chosen, setChosen] = useState(stored)
  // A page that speaks to someone else (the customer page) sets the whole page's language while open.
  const [pageLang, setPageLang] = useState(null)
  const lang = (profile?.language ?? chosen) === 'ar' ? 'ar' : 'en'
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const shown = pageLang ?? lang
  setDateLanguage(lang)

  useEffect(() => {
    document.documentElement.lang = shown
    document.documentElement.dir = shown === 'ar' ? 'rtl' : 'ltr'
  }, [shown])
  // Signed in, the profile's language is the one to start with next time on this browser too.
  useEffect(() => {
    if (profile?.language) store(profile.language)
  }, [profile?.language])

  const setLang = useCallback(
    async (next) => {
      store(next)
      setChosen(next)
      if (profile) {
        await setMyLanguage(next)
        await reloadProfile()
      }
    },
    [profile, reloadProfile],
  )

  const value = useMemo(
    () => ({
      lang,
      dir,
      /** The words for a key ("admin.team.title") with {values}; the key itself if it has none, so a gap shows. */
      t: (key, values) => translate(lang, key, values) ?? missing(key),
      errorText: (err) => refusalText(lang, err),
      setLang,
      /** The customer page: the whole page reads in `l` while it is open (null gives it back). */
      setPageLang,
    }),
    [lang, dir, setLang],
  )

  return (
    <LangContext.Provider value={value}>
      <Fragment key={lang}>{children}</Fragment>
    </LangContext.Provider>
  )
}
