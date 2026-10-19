import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Returns to the top of the page on navigation.
 *
 * The browser restores scroll position on a history POP (back/forward), which
 * is the behaviour a user expects there — so this only fires on PUSH/REPLACE.
 * The old string router scrolled unconditionally inside navigate(), which had
 * no way to tell the two apart.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return null
}
