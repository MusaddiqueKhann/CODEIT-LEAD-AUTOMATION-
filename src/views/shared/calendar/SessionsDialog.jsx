import { Link } from 'react-router-dom'
import { Button, Modal, StepBadge } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { memberPath } from '../../../routes/paths.js'
import { SessionAvatar } from './SessionAvatar.jsx'

/**
 * The sessions behind a stacked card or a busy month day, or a day's tasks. Each item carries its
 * `step` and `right` (the time, or what is due). A whole day also offers the day or week view.
 */
export function SessionsDialog({ open, title, sub, items, onClose, onDayView, onWeekView }) {
  const { person } = useConfig()
  const { t } = useLang()
  return (
    <Modal id="sessions-dialog-on-day-view"
      open={open}
      onClose={onClose}
      size="lg"
      title={title}
      description={sub}
      footer={
        onDayView && (
          <div className="-mx-6.5 -mb-6 flex flex-1 gap-2 border-t border-line px-5 pt-3.5 pb-5">
            <Button id="sessions-dialog-day-view" size="lg" className="flex-1" onClick={onDayView}>
              {t('shared.calendar.dayView')}
            </Button>
            <Button id="sessions-dialog-week-view" variant="soft" size="lg" className="flex-1" onClick={onWeekView}>
              {t('shared.calendar.weekView')}
            </Button>
          </div>
        )
      }
    >
      <div className="-mx-3 -mt-2 flex flex-col gap-1.5">
        {items.map((i) => (
          <Link id={`sessions-dialog-with-person-${i.id}`} key={i.id} to={i.code ? memberPath(i.code) : '#'} className="v-sessions-dialog__with-person flex items-center gap-3 rounded-[18px] p-3 text-ink transition-colors hover:bg-surface-2">
            <SessionAvatar item={i} className="size-10 text-[13px]" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{i.title}</span>
              <span className="text-[13px] text-muted">{person(i.personId) ? t('shared.calendar.withPerson', { name: person(i.personId).name.split(' ')[0] }) : t('shared.calendar.nobodyYet')}</span>
            </span>
            <StepBadge step={i.step} className="h-7 w-28 text-xs" />
            <span className="w-35 text-end text-sm tabular-nums">{i.right}</span>
          </Link>
        ))}
      </div>
    </Modal>
  )
}
