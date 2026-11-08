import Icon from '../../../components/Icon.jsx'
import { StatTile } from '../../../components/shared/index.js'
import { Badge, Button } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { formatShort, formatStamp, fromDay, fromServer, riyadhNow, startOfDay } from '../../../models/rules/format.js'
import { documentsOf, dueOn } from '../../../models/rules/members.js'

/** Whole days from today to a "YYYY-MM-DD" day (negative once it has passed). */
const daysTo = (day) => Math.round((fromDay(day) - startOfDay(riyadhNow())) / 864e5)

/** The deadline that matters at this step: Transfer, integrations, the setup checklist, or the customer's link. */
function dueTile(m, label, t) {
  const next = label('step', m.integrations.length ? 'integration' : 'onboarding')
  const by = (day, title, pill) => {
    if (!day) return { title, aside: <Badge size="sm" tone="brand">{pill}</Badge>, big: '—', sub: t('member.tiles.bookFirst') }
    const n = daysTo(day)
    return {
      title,
      aside: <Badge size="sm" tone={n < 0 ? 'danger' : 'brand'}>{pill}</Badge>,
      big: Math.abs(n),
      unit: t(n < 0 ? 'member.tiles.daysLate' : 'member.tiles.daysLeft', { n: Math.abs(n) }),
      sub: t('member.tiles.due', { date: formatShort(fromDay(day)) }),
    }
  }
  if (m.outcome) return { title: label('step', m.outcome), big: '—', sub: m.outcomeReason || t('member.tiles.stopped') }
  if (m.stage === 'collecting') return by(m.transferDeadline, t('member.tiles.transfer'), next)
  if (m.stage === 'integration') return by(m.integrationDue, label('step', 'integration'), label('step', 'onboarding'))
  if (m.stage === 'setup' || m.stage === 'session') return by(m.setupDue, t('member.tiles.setupChecklist'), t('member.tiles.session'))
  if (m.stage === 'recording' && m.linkExpiresAt) {
    const h = Math.max(0, Math.ceil((fromServer(m.linkExpiresAt) - riyadhNow()) / 36e5))
    return {
      title: t('member.tiles.feedbackLink'),
      aside: <Badge size="sm" tone="warn">{t('member.tiles.open')}</Badge>,
      big: h,
      unit: t('member.tiles.hoursLeft', { n: h }),
      sub: t('member.tiles.until', { at: formatStamp(fromServer(m.linkExpiresAt)) }),
    }
  }
  return {
    title: label('step', 'closed'),
    aside: <Badge size="sm" tone="neutral">{t('member.tiles.done')}</Badge>,
    big: '—',
    sub: m.rating ? t('member.tiles.rated', { n: m.rating }) : t('member.tiles.noRating'),
  }
}

/** The member at a glance: the session, the files, the next deadline and how to reach them. */
export function OverviewTiles({ member: m, onTab }) {
  const { label, lists } = useConfig()
  const { t: say } = useLang()
  const t = documentsOf(lists.document, m).tally
  const s = m.session
  const days = s && Math.round((startOfDay(s.date) - startOfDay(riyadhNow())) / 864e5)
  const minutes = s && Math.round((Date.parse(m.sessionEndsAt) - Date.parse(m.sessionAt)) / 6e4)
  const open = (
    <Button
      variant="bare"
      aria-label={say('member.tiles.openSession')}
      onClick={() => onTab(m.stage === 'collecting' ? 'sales' : 'onboarding')}
      className="grid size-9 shrink-0 place-items-center rounded-full bg-panel text-ink ring-[1.5px] ring-edge ring-inset transition hover:-rotate-12 rtl:hover:rotate-12"
    >
      <Icon name="arrowUpRight" className="size-4" strokeWidth={1.8} />
    </Button>
  )

  const tiles = [
    {
      title: say('member.tiles.nextSession'),
      aside: open,
      big: !s ? '—' : days === 0 ? say('member.tiles.today') : Math.abs(days),
      unit: s && days !== 0 ? say(days < 0 ? 'member.tiles.daysAgo' : 'member.tiles.days', { n: Math.abs(days) }) : null,
      sub: s ? say('member.tiles.sessionLine', { date: formatShort(s.date), time: s.time, min: minutes }) : say('member.tiles.notBooked'),
    },
    {
      title: say('member.tiles.readiness'),
      aside:
        t.done === t.total ? <Badge size="sm" tone="success">{say('member.tiles.ready')}</Badge>
        : <Badge size="sm" tone="warn">{t.latest != null ? say('member.tiles.by', { date: dueOn(t.latest) }) : say('member.tiles.filesMissing')}</Badge>,
      big: t.total ? Math.round((t.done / t.total) * 100) : 100,
      unit: '%',
      sub: say('member.tiles.uploaded', { done: t.done, n: t.total }),
    },
    dueTile(m, label, say),
    {
      title: say('member.tiles.contact'),
      aside: <Badge size="sm" tone="neutral">{say(m.language === 'ar' ? 'common.arabic' : 'common.english')}</Badge>,
      big: m.phone,
      small: true,
      sub: m.email,
    },
  ]

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      {tiles.map((tile, i) => (
        <StatTile key={tile.title} index={i} {...tile} />
      ))}
    </div>
  )
}
