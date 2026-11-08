import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { cx } from '../cx.js'
import { TONES } from '../tones.js'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { useToast } from '../../controllers/shared/ToastContext.jsx'

const ICONS = { success: 'checkCircle', warn: 'info', danger: 'alert', brand: 'bell' }

export function Toasts() {
  const { toasts, dismissToast } = useToast()
  const { t: say } = useLang()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const tone = TONES[t.tone] ?? TONES.success

        return (
          <div
            key={t.id}
            role="status"
            className={cx(
              'pointer-events-auto relative isolate flex w-full max-w-md items-start gap-3',
              'overflow-hidden rounded-xl border px-4 py-3 text-sm font-medium',
              // Opaque panel base, tone wash layered over it below. Putting
              // bg-panel and the tone's bg-*/12 on the same element left the
              // winner to CSS source order rather than class order — the
              // toast's background was effectively undefined.
              'bg-panel shadow-lg shadow-black/5 backdrop-blur',
              tone.border,
              tone.text,
            )}
          >
            <span className={cx('absolute inset-0 -z-10', tone.fill)} />

            <Icon name={ICONS[t.tone] ?? 'checkCircle'} className="mt-0.5 size-4 shrink-0" />
            <span className="flex-1">{t.message}</span>
            {t.action?.to && (
              <Link id={`toasts-dismiss-toast-${t.id}`} to={t.action.to} onClick={() => dismissToast(t.id)} className="ui-toasts__dismiss-toast shrink-0 underline underline-offset-2">
                {t.action.label}
              </Link>
            )}
            {t.action?.onClick && (
              <button id={`toasts-dismiss-${t.id}`}
                type="button"
                onClick={() => {
                  dismissToast(t.id)
                  t.action.onClick()
                }}
                className="ui-toasts__dismiss shrink-0 font-medium underline underline-offset-2"
              >
                {t.action.label}
              </button>
            )}
            <button id={`toasts-dismiss-2-${t.id}`}
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label={say('shared.common.dismiss')}
              className="ui-toasts__dismiss-2 opacity-60 transition hover:opacity-100"
            >
              <Icon name="close" className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
