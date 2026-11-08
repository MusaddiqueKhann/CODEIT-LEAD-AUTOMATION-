import { useBrand } from '../../controllers/shared/useBrand.js'
import { LOGO } from '../logo.js'

/** A centred message on the canvas, for loading and for errors before the shell can draw. */
export function FullScreenMessage({ title, text, children }) {
  const brand = useBrand()
  return (
    <div className="grid min-h-screen place-items-center bg-shell p-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <img src={LOGO} alt={brand.app} className="h-12 w-auto" />
        <p className="font-display text-xl text-ink">{title}</p>
        {text && <p className="text-sm text-muted">{text}</p>}
        {children}
      </div>
    </div>
  )
}
