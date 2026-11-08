import { useState } from 'react'

/**
 * Options as the screen shows them: `source` (from the server) with the changes just made laid
 * over it, so a tick or switch moves at once instead of after the server answers. The next load of
 * `source` replaces them all. `show(option)` lays one change over; `drop(key)` takes it back (when
 * saving failed).
 */
export function useShownNow(source) {
  const [over, setOver] = useState({})
  const [seen, setSeen] = useState(source)
  if (seen !== source) {
    setSeen(source)
    setOver({})
  }
  const shown = source.map((o) => over[o.key] ?? o).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  const show = (o) => setOver((x) => ({ ...x, [o.key]: o }))
  const drop = (key) =>
    setOver((x) => {
      const rest = { ...x }
      delete rest[key]
      return rest
    })
  return { shown, show, drop }
}
