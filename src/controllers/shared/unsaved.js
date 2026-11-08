import { createContext, useContext, useEffect, useRef } from 'react'

/** The Settings page's change tracker: `track(key, dirty, save)`. */
export const Unsaved = createContext(() => {})

/**
 * Tells the page's Save bar that this part has changes (`dirty`) and how to save them (`save`,
 * resolving false when it failed). Leaving the page part un-tracks it.
 */
export function useUnsaved(key, dirty, save) {
  const track = useContext(Unsaved)
  const latest = useRef(save)
  useEffect(() => {
    latest.current = save
  })
  useEffect(() => track(key, dirty, () => latest.current()), [track, key, dirty])
  useEffect(() => () => track(key, false), [track, key])
}
