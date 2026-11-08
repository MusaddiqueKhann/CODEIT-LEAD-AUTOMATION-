import { Fragment, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button, Icon, MemberAvatar, PageHeader, ReasonDialog } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useActivity } from '../../../controllers/shared/useActivity.js'
import { useMember } from '../../../controllers/shared/useMembers.js'
import { useMemberActions } from '../../../controllers/shared/useMemberActions.js'
import { ROUTES } from '../../../routes/paths.js'
import { STEPS, tabOfAction } from '../../../models/rules/stages.js'
import { OutcomeBanner } from './OutcomeBanner.jsx'
import { OverviewTab } from './OverviewTab.jsx'
import { StepNote } from './StepNote.jsx'
import { StepTabs } from './StepTabs.jsx'
import { WithNow } from './WithNow.jsx'

const TABS = ['overview', ...STEPS]
const HEAD = 'flex h-12 items-center gap-2 rounded-[14px] px-4 text-[13px] whitespace-nowrap transition'
const HEAD_BUTTON = `${HEAD} bg-surface text-ink hover:bg-surface-hover`

/**
 * One member, as tabs: Overview, then one per step (`tabs`, from the routes: each portal's tab). Each step's tab holds that step's own work;
 * its buttons show only there, and only to whoever the server lets do them (that step's person or
 * the Admin). Everyone else on the member reads it. The tab is in the address (?tab=sales).
 */
export function MemberDetailsPage({ tabs }) {
  const { code } = useParams()
  const [params, setParams] = useSearchParams()
  const asked = TABS.includes(params.get('tab')) ? params.get('tab') : 'overview'
  const { label } = useConfig()
  const { t, errorText } = useLang()
  const member = useMember(code)
  const m = member.data
  const activity = useActivity(m?.id)
  const act = useMemberActions(m, () => {
    member.reload()
    activity.reload()
  })
  const [cancelling, setCancelling] = useState(false)

  if (m === undefined && !member.error) return <Note>{t('shared.common.loading')}</Note>
  if (!m) {
    return (
      <Note>
        {member.error ? t('shared.member.page.couldntLoad', { error: errorText(member.error) }) : t('shared.member.page.notFound', { code })}{' '}
        <Link id="member-details-page-back-to-members" to={ROUTES.members} className="v-member-details-page__back-to-members text-brand-700 hover:text-brand-800">
          {t('shared.member.page.backToMembers')}
        </Link>
      </Note>
    )
  }

  // A member with no integrations skips that step, so its tab doesn't open (an old link lands on Overview).
  const tab = asked === 'integration' && m.integrations.length === 0 ? 'overview' : asked
  // Each step's tab comes from the portal that works it (the routes pass them in).
  const StepTab = tabs[tab]
  const can = new Set(m.actions)
  // This tab's buttons only: another step's work is read here, not done.
  const mine = new Set(m.actions.filter((a) => tabOfAction(a, m) === tab))
  const props = { member: m, can: mine, act }
  const go = (t) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true })
  const facts = [m.company, m.industry && label('industry', m.industry), m.code].filter(Boolean)

  return (
    <>
      <PageHeader
        back={ROUTES.members}
        media={<MemberAvatar name={m.name} size="size-14 rounded-[18px] text-lg" />}
        title={m.name}
        sub={
          <span className="flex flex-wrap items-center gap-2.5 text-soft">
            {facts.map((f, i) => (
              <Fragment key={f}>
                {i > 0 && <span className="size-0.75 rounded-full bg-off-ring" />}
                {f}
              </Fragment>
            ))}
          </span>
        }
        actions={
          <>
            <WithNow member={m} />
            {can.has('edit') && tab !== 'sales' && (
              <Button id="member-details-page-edit" variant="bare" className={HEAD_BUTTON} onClick={() => go('sales')}>
                <Icon name="pencil" className="size-4" strokeWidth={1.8} />
                {t('shared.common.edit')}
              </Button>
            )}
            {can.has('cancel') && (
              <Button id="member-details-page-cancel-member" variant="bare" className={`${HEAD} bg-danger-bg/60 text-danger-ink hover:bg-danger-bg`} onClick={() => setCancelling(true)}>
                {t('shared.member.page.cancelMember')}
              </Button>
            )}
          </>
        }
      />

      <OutcomeBanner member={m} can={can} act={act} />
      <StepTabs member={m} tab={tab} onTab={go} />
      <StepNote member={m} step={tab} mine={mine.size > 0} />

      {tab === 'overview' ? <OverviewTab {...props} activity={activity} onTab={go} /> : <StepTab key={m.id} {...props} onTab={go} />}

      <ReasonDialog id="member-details-page-cancel-title"
        open={cancelling}
        onClose={() => setCancelling(false)}
        title={t('shared.member.page.cancelTitle')}
        description={t('shared.member.page.cancelDescription')}
        confirmLabel={t('shared.member.page.cancelMember')}
        tone="danger"
        onConfirm={({ text }) => act.cancel(text)}
      />
    </>
  )
}

function Note({ children }) {
  return <div className="rounded-card bg-panel px-6 py-12 text-center text-sm text-muted shadow-card">{children}</div>
}
