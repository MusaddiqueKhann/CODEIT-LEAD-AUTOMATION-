import { cx } from '../cx.js'
import { Button } from '../ui/Button.jsx'

/**
 * The bar that stays in view at the bottom of a long form: what the form says now (`children`),
 * then Cancel and Save. `saveDisabled` holds Save back (something still needed); `busy` holds
 * both and shows `savingLabel`.
 */
export function FormBar({ children, cancelLabel, saveLabel, savingLabel, busy, saveDisabled = false, onCancel, onSave, className }) {
  return (
    <div className={cx('ui-form-bar sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-[20px] bg-panel py-3 pe-3 shadow-[0_20px_40px_-20px_rgba(17,24,39,0.3)] ring-1 ring-line', className)}>
      {children}
      <Button id="form-bar-on-cancel" variant="outline" onClick={onCancel} disabled={busy}>
        {cancelLabel}
      </Button>
      <Button id="form-bar-on-save" onClick={onSave} disabled={saveDisabled || busy}>
        {busy ? savingLabel : saveLabel}
      </Button>
    </div>
  )
}
