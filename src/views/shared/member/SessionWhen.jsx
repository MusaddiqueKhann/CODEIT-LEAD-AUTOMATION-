import { formatShort, monthShort } from '../../../models/rules/format.js'
import { toMinutes, toTime } from '../../../models/rules/time.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'

/** When the session is: a small calendar leaf, the day, and its time range in Riyadh time. */
export function SessionWhen({ member: m }) {
  const { t } = useLang()
  const s = m.session
  const minutes = Math.round((Date.parse(m.sessionEndsAt) - Date.parse(m.sessionAt)) / 6e4)
  return (
    <div className="flex items-center gap-3.5 rounded-[18px] bg-brand-mist py-2.5 ps-2.5 pe-4">
      <div className="w-13 shrink-0 overflow-hidden rounded-[14px] bg-panel text-center ring-1 ring-brand-line">
        <span className="block bg-brand-700 py-0.5 text-[10px] tracking-[0.12em] text-white uppercase">{monthShort(s.date)}</span>
        <span className="block pt-1 pb-1.5 text-lg text-ink">{s.date.getDate()}</span>
      </div>
      <span className="flex flex-col gap-0.5">
        <span className="text-[17px] tracking-[-0.02em] text-ink">{formatShort(s.date)}</span>
        <span className="text-[13px] text-soft tabular-nums">
          {s.time} – {toTime(toMinutes(s.time) + minutes)} · {t('shared.member.sessionWhen.riyadh')}
        </span>
      </span>
    </div>
  )
}
