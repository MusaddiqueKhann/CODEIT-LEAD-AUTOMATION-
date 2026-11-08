import { useState } from 'react'
import { Notice } from '../ui/Notice.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'
import { cx } from '../cx.js'
import { formatShort, fromDay } from '../../models/rules/format.js'
import { initials } from '../../models/rules/time.js'
import { TONES } from '../tones.js'

/**
 * Why someone is free or busy, from the server's short code ("free:2", "leave:2026-11-10",
 * "session:13:00", "outside_hours"…), in the reader's language.
 */
function reasonText(code, t) {
  const [what, value = ''] = code.split(/:(.*)/s)
  return t(`shared.components.picker.reasons.${what}`, { n: value, date: value && what === 'leave' ? formatShort(fromDay(value)) : value, time: value })
}

/**
 * The Admin's list of people for a role: free first with "Free · 2 open", busy greyed with why.
 * Picking someone busy asks once more. `options` come from the server (personOptions);
 * `onPick(id)` resolves true to close.
 */
export function PersonPicker({ open, onClose, title, options, current, onPick }) {
  const { t } = useLang()
  const [busyPick, setBusyPick] = useState(null)
  const [saving, setSaving] = useState(false)

  const pick = async (p) => {
    if (!p.free && busyPick?.id !== p.id) {
      setBusyPick(p)
      return
    }
    setSaving(true)
    const done = await onPick(p.id)
    setSaving(false)
    if (done) {
      setBusyPick(null)
      onClose()
    }
  }

  return (
    <Modal id="person-picker-loading" open={open} onClose={onClose} title={title} size="md">
      {!options ? (
        <p className="py-6 text-center text-sm text-muted">{t('shared.common.loading')}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {options.map((p) => (
            <Button id={`person-picker-pick-${p.id}`}
              key={p.id}
              variant="bare"
              disabled={saving || p.id === current}
              onClick={() => pick(p)}
              className={cx(
                'flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-start transition',
                p.id === current ? 'bg-brand-100' : 'hover:bg-surface-2',
                !p.free && 'opacity-60',
              )}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-xs font-medium text-ink">
                {initials(p.name)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-ink">{p.name}</span>
                <span className={cx('truncate text-xs', p.free ? TONES.success.text : 'text-muted')}>{reasonText(p.reason, t)}</span>
              </span>
              {p.id === current && <span className="text-xs text-brand-800">{t('shared.components.picker.hasIt')}</span>}
            </Button>
          ))}
          {busyPick && (
            <Notice tone="warn" icon={null} role="alert" className="mt-2">
              {t('shared.components.picker.busy', { name: busyPick.name, reason: reasonText(busyPick.reason, t) })}
            </Notice>
          )}
        </div>
      )}
    </Modal>
  )
}
