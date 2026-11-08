import { Badge, IconButton, StatTile } from '@/components'
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
    if (!day) return { title, aside: <Badge size="sm" tone="brand">{pill}</Badge>, big: '—', sub: t('shared.member.tiles.bookFirst') }
    const n = daysTo(day)
    return {
      title,
      aside: <Badge size="sm" tone={n < 0 ? 'danger' : 'brand'}>{pill}</Badge>,
      big: Math.abs(n),
      unit: t(n < 0 ? 'shared.member.tiles.daysLate' : 'shared.member.tiles.daysLeft', { n: Math.abs(n) }),
      sub: t('shared.member.tiles.due', { date: formatShort(fromDay(day)) }),
    }
  }
  if (m.outcome) return { title: label('step', m.outcome), big: '—', sub: m.outcomeReason || t('shared.member.tiles.stopped') }
  if (m.stage === 'collecting') return by(m.transferDeadline, t('shared.member.tiles.transfer'), next)
  if (m.stage === 'integration') return by(m.integrationDue, label('step', 'integration'), label('step', 'onboarding'))
  if (m.stage === 'setup' || m.stage === 'session') return by(m.setupDue, t('shared.member.tiles.setupChecklist'), t('shared.member.tiles.session'))
  if (m.stage === 'recording' && m.linkExpiresAt) {
    const h = Math.max(0, Math.ceil((fromServer(m.linkExpiresAt) - riyadhNow()) / 36e5))
    return {
      title: t('shared.member.tiles.feedbackLink'),
      aside: <Badge size="sm" tone="warn">{t('shared.member.tiles.open')}</Badge>,
      big: h,
      unit: t('shared.member.tiles.hoursLeft', { n: h }),
      sub: t('shared.member.tiles.until', { at: formatStamp(fromServer(m.linkExpiresAt)) }),
    }
  }
  return {
    title: label('step', 'closed'),
    aside: <Badge size="sm" tone="neutral">{t('shared.member.tiles.done')}</Badge>,
    big: '—',
    sub: m.rating ? t('shared.member.tiles.rated', { n: m.rating }) : t('shared.member.tiles.noRating'),
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
    <IconButton id="overview-tiles-open-session" icon="arrowUpRight" label={say('shared.member.tiles.openSession')} size={9} look="outlinePanel" onClick={() => onTab(m.stage === 'collecting' ? 'sales' : 'onboarding')} className="hover:-rotate-12 rtl:hover:rotate-12" />
  )

  const tiles = [
    {
      title: say('shared.member.tiles.nextSession'),
      aside: open,
      big: !s ? '—' : days === 0 ? say('shared.member.tiles.today') : Math.abs(days),
      unit: s && days !== 0 ? say(days < 0 ? 'shared.member.tiles.daysAgo' : 'shared.member.tiles.days', { n: Math.abs(days) }) : null,
      sub: s ? say('shared.member.tiles.sessionLine', { date: formatShort(s.date), time: s.time, min: minutes }) : say('shared.member.tiles.notBooked'),
    },
    {
      title: say('shared.member.tiles.readiness'),
      aside:
        t.done === t.total ? <Badge size="sm" tone="success">{say('shared.member.tiles.ready')}</Badge>
        : <Badge size="sm" tone="warn">{t.latest != null ? say('shared.member.tiles.by', { date: dueOn(t.latest) }) : say('shared.member.tiles.filesMissing')}</Badge>,
      big: t.total ? Math.round((t.done / t.total) * 100) : 100,
      unit: '%',
      sub: say('shared.member.tiles.uploaded', { done: t.done, n: t.total }),
    },
    dueTile(m, label, say),
    {
      title: say('shared.member.tiles.contact'),
      aside: <Badge size="sm" tone="neutral">{say(m.language === 'ar' ? 'shared.common.arabic' : 'shared.common.english')}</Badge>,
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
