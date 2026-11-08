import Icon from '../../../components/Icon.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { formatStamp, fromServer } from '../../../models/rules/format.js'
import { statusOf } from '../../../models/rules/stages.js'
import { initials } from '../../../models/rules/time.js'

/** The header's chip: who has the member now, and at which step; once it ended well, Closed and when. */
export function WithNow({ member: m }) {
  const { label, person } = useConfig()
  const { t } = useLang()
  if (m.stage === 'closed' && !m.outcome) {
    return (
      <div className="flex items-center gap-2.5 rounded-[14px] bg-success-bg py-1.75 ps-1.75 pe-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-success text-white">
          <Icon name="check" className="size-4.5" strokeWidth={2.4} />
        </span>
        <span className="flex flex-col">
          <span className="text-sm text-success-ink">{label('step', 'closed')}</span>
          <span className="text-[11px] text-success-ink/75">{formatStamp(fromServer(m.holderSince))}</span>
        </span>
      </div>
    )
  }
  const holder = person(m.holderId)
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] bg-surface py-1.75 ps-1.75 pe-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-700 text-[13px] text-white">{holder ? initials(holder.name) : '—'}</span>
      <span className="flex flex-col">
        <span className="text-[11px] text-faint">{t('member.withNow.label', { step: label('step', statusOf(m)) })}</span>
        <span className="text-sm text-ink">
          {holder?.name ?? (m.outcome || m.stage === 'closed' ? '—' : m.stage === 'recording' ? t('member.withNow.customer') : t('member.withNow.nobody'))}
        </span>
      </span>
    </div>
  )
}
