import { useEffect } from 'react'
import { useLang } from './LangContext.jsx'
import { brandOf, loadBrand } from '../../models/data/settings.js'
import { useRows } from './useRows.js'

/**
 * The brand words (Settings → Company) for pages before sign-in, where the settings can't be read:
 * { app, product, legal } in the reader's language, empty while loading. It also titles the browser tab.
 */
export function useBrand() {
  const { lang } = useLang()
  const brand = brandOf(useRows(loadBrand, 'brand').data ?? {}, lang)
  useEffect(() => {
    if (brand.app) document.title = brand.app
  }, [brand.app])
  return brand
}
