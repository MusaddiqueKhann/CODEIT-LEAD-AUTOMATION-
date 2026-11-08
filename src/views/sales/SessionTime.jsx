import { useState } from 'react'
import { PickTimeSection } from '../../components/shared/index.js'
import { Button, cx } from '../../components/ui/index.js'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { formatShort, toServer } from '../../models/rules/format.js'
import { Notice } from '../shared/member/Notice.jsx'
import { SessionWhen } from '../shared/member/SessionWhen.jsx'

/**
 * The Sales tab's section 4: the booked session, with Change time to move it, or the picker
 * straight away when nothing is booked (after a No-show, too). A pick is booked at once with
 * `onBook(at)`, which saves any unsaved form changes first. `set` (the form's) makes the files'
 * date editable here; without it the date is read-only.
 */
export function SessionTime({ member: m, draft, set, canBook, onBook, busy }) {
  const { t } = useLang()
  const [changing, setChanging] = useState(false)
  const [slot, setSlot] = useState(null)
  const open = canBook && (changing || !m.session)
  const missed = m.noShows > 0 && !m.session
  const stop = () => {
    setChanging(false)
    setSlot(null)
  }
  const book = async () => {
    if (await onBook(toServer(slot.date, slot.time))) stop()
  }

  return (
    <PickTimeSection
      draft={draft}
      set={set}
      value={slot}
      onChange={setSlot}
      memberId={m.id}
      open={open}
      aside={
        canBook && m.session && (changing ? (
          <Button variant="soft" onClick={stop}>
            {t('member.sessionTime.keep')}
          </Button>
        ) : (
          <Button variant="soft" onClick={() => setChanging(true)}>
            {t('member.sessionTime.change')}
          </Button>
        ))
      }
      top={
        m.session ? (
          <div className={cx('flex py-5', open && 'border-b border-line')}>
            <SessionWhen member={m} />
          </div>
        ) : missed ? (
          <div className="pt-5">
            <Notice tone="warn" icon="calendar">
              {t('member.sessionTime.missed', { n: m.noShows })} {t(canBook ? 'member.sessionTime.pickNew' : 'member.sessionTime.salesBooks')}
            </Notice>
          </div>
        ) : (
          !canBook && <p className="py-5 text-sm text-muted">{t('member.sessionTime.notBooked')}</p>
        )
      }
      bottom={
        <div className="flex justify-end border-t border-line pt-4 pb-3">
          <Button disabled={!slot || busy} onClick={book}>
            {slot ? t('member.sessionTime.book', { date: formatShort(slot.date), time: slot.time }) : t('member.sessionTime.pickDayTime')}
          </Button>
        </div>
      }
    />
  )
}
