import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, Icon, ListHead, PageHeader, SearchBox } from '@/components'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useMembers } from '../../../controllers/shared/useMembers.js'
import { formatLong, riyadhNow } from '../../../models/rules/format.js'
import { NAV, ROUTES } from '../../../routes/paths.js'
import { atStep } from '../../../models/rules/stages.js'
import { COLUMNS, MemberRow } from './MemberRow.jsx'

/* The filters the sidebar and the Overviews open this page with, in the address. */
const FILTERS = ['step', 'plan', 'team']

/** Members this person is on, in any role (the sidebar's My Members, ?show=mine). */
const isMine = (m, me) => [m.salesId, m.accountPersonId, m.integrationId, m.onboardingId].includes(me)

/**
 * Every member (everyone on the team may read them all), open, closed and lost together (the step
 * badge says which), with search. The filters live in the address (?show=mine, ?step=, ?plan=,
 * ?team=), so the sidebar and the Overviews open this page filtered, even while it is already open.
 */
export function MembersPage() {
  const { role, profile } = useAuth()
  const { person } = useConfig()
  const { t, errorText } = useLang()
  const { data: members, error } = useMembers()
  const [query, setQuery] = useState('')
  const [params] = useSearchParams()
  const show = params.get('show') === 'mine' ? 'mine' : ''
  const filters = Object.fromEntries(FILTERS.map((k) => [k, params.get(k) ?? '']))
  const canAdd = NAV.find((n) => n.key === 'addMember').roles.includes(role)

  /* Phones and codes match with spaces ignored, so "55214" finds "+966 55 214 8830". */
  const q = query.trim().toLowerCase()
  const compact = (s) => (s ?? '').toLowerCase().replace(/\s/g, '')
  const matches = (m) =>
    (!q || [m.name, m.company].some((v) => v.toLowerCase().includes(q)) || [m.phone, m.code].some((v) => compact(v).includes(compact(q)))) &&
    (!filters.step || atStep(m, filters.step)) &&
    (!show || isMine(m, profile.id)) &&
    (!filters.plan || m.plan === filters.plan) &&
    (!filters.team || person(m.holderId)?.role === filters.team)

  const shown = (members ?? []).filter(matches)

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-2rem)]">
      <PageHeader
        title={t('shared.members.list.title')}
        sub={t(show ? 'shared.members.list.subMine' : 'shared.members.list.subAll', { date: formatLong(riyadhNow()) })}
        actions={
          canAdd && (
            <Link id="members-page-add-member"
              to={ROUTES.addMember}
              className="v-members-page__add-member flex h-11 items-center gap-2 rounded-full bg-brand-700 px-5 text-sm whitespace-nowrap text-white transition hover:bg-brand-800"
            >
              <Icon name="plus" className="size-4" strokeWidth={2.2} />
              {t('shared.layout.nav.addMember')}
            </Link>
          )
        }
      >
        <SearchBox id="members-page-search-label" value={query} onChange={setQuery} placeholder={t('shared.members.list.search')} label={t('shared.members.list.searchLabel')} />
      </PageHeader>

      <Card padding="none" clip className="flex animate-rise flex-col [animation-delay:.08s] lg:min-h-0 lg:flex-1">
        <div className="scrollbar-slim min-h-0 flex-1 overflow-auto">
          <div className="min-w-160">
            <div className="sticky top-0 z-2 bg-panel px-3 pt-3 pb-1.5">
              <ListHead columns={COLUMNS}>
                <span className="ps-13.5">{t('shared.members.list.member')}</span>
                <span>{t('shared.members.list.step')}</span>
                <span>{t('shared.members.list.withNow')}</span>
                <span />
              </ListHead>
            </div>
            {shown.map((m, i) => (
              <MemberRow key={m.id} member={m} index={i} />
            ))}
            {error && <p className="px-6 py-12 text-center text-sm text-muted">{t('shared.members.list.loadError', { error: errorText(error) })}</p>}
            {!members && !error && <p className="px-6 py-12 text-center text-sm text-muted">{t('shared.members.list.loading')}</p>}
            {members && shown.length === 0 && (
              <p className="px-6 py-12 text-center text-sm text-muted">
                {t(q || show || Object.values(filters).some(Boolean) ? 'shared.members.list.noMatch' : 'shared.members.list.none')}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
