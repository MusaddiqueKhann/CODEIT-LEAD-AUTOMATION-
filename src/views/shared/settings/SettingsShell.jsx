import { useCallback, useRef, useState } from 'react'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useToast } from '../../../controllers/shared/ToastContext.jsx'
import { SaveBar } from './SaveBar.jsx'
import { Unsaved } from '../../../controllers/shared/unsaved.js'

/**
 * A settings page: the header, then its parts ([key, Part]), then the Save bar. Every part reports
 * its changes to the bar, which saves them all at once or undoes them all (Cancel puts each part
 * back as it was). `labelled` puts each part's name (settings.parts.<key>) above it; `bar` names
 * the bar's words (settings.<bar>.*), or is false where every part saves as you go (no bar).
 * `fill` makes the page exactly the screen's height (from laptop size up); its part fills the rest
 * and scrolls inside.
 */
export function SettingsShell({ header, parts, labelled, bar = 'bar', fill = false }) {
  const config = useConfig()
  const { toast } = useToast()
  const { t, errorText } = useLang()
  const saves = useRef(new Map())
  const [dirty, setDirty] = useState(() => new Set())
  const [round, setRound] = useState(0)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const track = useCallback((key, on, save) => {
    if (on) saves.current.set(key, save)
    else saves.current.delete(key)
    setDirty((d) => {
      if (d.has(key) === on) return d
      const next = new Set(d)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })
    if (on) setSaved(false)
  }, [])

  const saveAll = async () => {
    setBusy(true)
    let ok = true
    for (const save of [...saves.current.values()]) {
      // A part that refuses outright (instead of resolving false) still lets the others save.
      const done = await Promise.resolve().then(save).catch((err) => {
        toast(errorText(err), 'danger')
        return false
      })
      ok = done !== false && ok
    }
    setBusy(false)
    if (ok) {
      setSaved(true)
      toast(t('settings.page.saved'))
    }
  }

  const content = (
    <>
      {header}
      {parts.map(([key, Part]) =>
        labelled ? (
          <div key={key} id={key} className="flex scroll-mt-4 flex-col gap-3">
            <span className="px-1.5 pt-2 text-xs tracking-[0.14em] text-muted uppercase">{t(`settings.parts.${key}`)}</span>
            <Part key={round} after={config.reload} />
          </div>
        ) : (
          <Part key={`${key}:${round}`} after={config.reload} fill={fill} />
        ),
      )}
      {bar && <SaveBar words={bar} dirty={dirty.size > 0} saved={saved} busy={busy} onCancel={() => setRound((r) => r + 1)} onSave={saveAll} />}
    </>
  )

  return <Unsaved.Provider value={track}>{fill ? <div className="flex flex-col gap-4 lg:h-[calc(100vh-2rem)]">{content}</div> : content}</Unsaved.Provider>
}
