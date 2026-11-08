import { getAfter } from '../models/data/after.js'
import { useRows } from './shared/useRows.js'

/** The customer's page for this link, in `lang` (null: the member's own language). */
export const useCustomerPage = (token, lang) => useRows(() => getAfter(token, lang), `${token}:${lang}`)

export { rateAfter } from '../models/data/after.js'
