import Icon from '../../../components/Icon.jsx'
import { Button, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { TONES } from '../../../components/tones.js'

/** Lost or Cancelled: the reason, and the Admin's Reopen for a Lost member. */
export function OutcomeBanner({ member: m, can, act }) {
  const { label } = useConfig()
  const { t } = useLang()
  if (!m.outcome) return null
  return (
    <div className={cx('flex flex-wrap items-center gap-3 rounded-[18px] px-5 py-4', TONES.danger.fill, TONES.danger.text)}>
      <Icon name="alert" className="size-5 shrink-0" strokeWidth={1.8} />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-medium">{label('step', m.outcome)}.</span> {m.outcomeReason}
      </p>
      {can.has('reopen') && (
        <Button variant="outline" onClick={act.reopen} disabled={act.busy}>
          {t('member.outcome.reopen')}
        </Button>
      )}
    </div>
  )
}
