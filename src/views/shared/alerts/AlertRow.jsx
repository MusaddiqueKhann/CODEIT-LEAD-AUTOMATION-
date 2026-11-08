import Icon from '../../../components/Icon.jsx'
import { Button, cx } from '../../../components/ui/index.js'
import { formatShort } from '../../../models/rules/format.js'
import { toTime } from '../../../models/rules/time.js'
import { TONES } from '../../../components/tones.js'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { pick } from '../../../content/index.js'

/* The icon, tone and button (alerts.cta.<key>) for each kind of alert; anything else is a plain bell. */
const LOOK = {
  late: ['clock', 'danger', 'open'],
  missed: ['calendar', 'danger', 'open'],
  job_failed: ['alert', 'danger', 'open'],
  low_rating: ['star', 'warn', 'viewFeedback'],
  nobody_free: ['users', 'warn', 'pickSomeone'],
  sent_back: ['refresh', 'warn', 'seeWhy'],
  no_show: ['calendar', 'warn', 'bookAgain'],
  doc_late: ['file', 'warn', 'open'],
  leave: ['calendar', 'neutral', 'openTeam'],
  holiday: ['calendar', 'neutral', 'openTeam'],
  given: ['userPlus', 'brand', 'open'],
  account_created: ['checkCircle', 'success', 'open'],
  account_reopened: ['shield', 'warn', 'open'],
  back: ['refresh', 'brand', 'open'],
  taken_off: ['users', 'neutral', 'open'],
  lost: ['close', 'danger', 'open'],
  cancelled: ['close', 'danger', 'open'],
  reopened: ['refresh', 'brand', 'open'],
  note: ['bubble', 'brand', 'readNote'],
  locked: ['lock', 'danger', 'openTeam'],
}

/** The list's columns, shared by the heading and every row. */
export const COLUMNS = 'grid grid-cols-[minmax(0,1fr)_120px_150px_150px_12px] items-center gap-5 px-4'

/** One alert. Clicking the row marks it read; its button opens what it is about. */
export function AlertRow({ alert: a, index, onRead, onOpen }) {
  const { t, lang } = useLang()
  const [icon, tone, cta] = LOOK[a.kind] ?? ['bell', 'neutral', 'open']
  const unread = !a.readAt
  return (
    <div
      onClick={() => unread && onRead(a)}
      style={{ animationDelay: `${0.12 + index * 0.05}s` }}
      className={cx(COLUMNS, 'mt-1 animate-rise cursor-pointer rounded-[18px] py-3 transition-colors hover:bg-[#f3f8f8]', unread && 'bg-[#f6fafa]')}
    >
      <span className="flex min-w-0 items-center gap-4">
        <span className={cx('grid size-10 shrink-0 place-items-center rounded-[13px]', TONES[tone].fill, TONES[tone].text)}>
          <Icon name={icon} className="size-4.25" strokeWidth={1.8} />
        </span>
        <span className={cx('text-sm leading-[1.4] text-ink', unread && 'font-medium')}>{pick(lang, a.text, a.textAr)}</span>
      </span>
      <span className="text-[13px] text-soft tabular-nums">{a.code ?? '—'}</span>
      <span className="text-[13px] whitespace-nowrap text-ink">
        {formatShort(a.at)} · {toTime(a.at.getHours() * 60 + a.at.getMinutes())}
      </span>
      <span>
        <Button
          variant="bare"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(a)
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-panel px-3.5 text-[13px] whitespace-nowrap text-ink ring-1 ring-edge transition hover:bg-surface"
        >
          {t(`alerts.cta.${cta}`)}
          <Icon name="chevronRight" className="size-3.5" strokeWidth={2} />
        </Button>
      </span>
      <span className={cx('size-2.5 rounded-full transition-colors', unread && 'bg-brand-700')} aria-label={unread ? t('alerts.unread') : undefined} />
    </div>
  )
}
