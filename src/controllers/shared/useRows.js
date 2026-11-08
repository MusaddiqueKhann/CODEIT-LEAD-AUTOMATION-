import { useCallback, useEffect, useState } from 'react'

/**
 * Runs an async `load` (a src/data function) and keeps its result in state.
 * `key` identifies what is loaded (e.g. a member code): when it changes, it loads again.
 * `reload()` fetches again after an action changed the data.
 */
export function useRows(load, key = '') {
  const [state, setState] = useState({ key: null, data: undefined, error: null })
  const [round, setRound] = useState(0)

  useEffect(() => {
    let live = true
    load().then(
      (data) => live && setState({ key, data, error: null }),
      (error) => live && setState({ key, data: null, error }),
    )
    return () => {
      live = false
    }
    // `load` is a fresh closure every render; `key` and `round` are what decide a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, round])

  const reload = useCallback(() => setRound((n) => n + 1), [])
  const current = state.key === key
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : null,
    loading: !current || (state.data === undefined && !state.error),
    reload,
  }
}
