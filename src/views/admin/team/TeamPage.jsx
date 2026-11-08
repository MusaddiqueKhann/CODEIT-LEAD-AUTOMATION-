import { useState } from 'react'
import { Button, Card, Icon, PageHeader, PasswordResult, SearchBox } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import * as team from '../../../controllers/admin/team.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { AddPersonDialog } from './AddPersonDialog.jsx'
import { TeamTable } from './TeamTable.jsx'
import { useTeam } from '../../../controllers/admin/team.js'

/** The Admin's team: who is on it, their role and status. A row opens their page, where the people actions are. */
export function TeamPage() {
  const config = useConfig()
  const { t, errorText } = useLang()
  const people = useTeam()
  const { run } = useAction(() => {
    people.reload()
    config.reload()
  })
  const [adding, setAdding] = useState(false)
  const [password, setPassword] = useState(null)
  const [query, setQuery] = useState('')

  const add = (form) =>
    run(async () => {
      const r = await team.addPerson({ ...form, password: form.password || undefined })
      setPassword({ ...r, title: t('admin.team.onTeam', { name: form.name }), name: form.name, email: form.email.trim().toLowerCase() })
    })

  /* Search finds a name, an email or a role's name. */
  const q = query.trim().toLowerCase()
  const shown = (people.data ?? []).filter((p) => !q || [p.name, p.email, config.label('role', p.role)].some((v) => v.toLowerCase().includes(q)))

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-2rem)]">
      <PageHeader
        title={t('admin.team.title')}
        sub={people.data ? t('admin.team.activeSub', { n: people.data.filter((p) => p.active && !p.mustChangePassword && !p.onLeaveUntil).length }) : t('shared.common.loading')}
        actions={
          <Button id="team-page-add-person" size="lg" onClick={() => setAdding(true)}>
            <Icon name="plus" className="size-4" strokeWidth={2.2} />
            {t('admin.team.addPerson')}
          </Button>
        }
      >
        <SearchBox id="team-page-search-label" value={query} onChange={setQuery} placeholder={t('admin.team.searchPlaceholder')} label={t('admin.team.searchLabel')} className="flex-[0_1_340px]" />
      </PageHeader>
      <Card padding="none" clip className="flex animate-rise flex-col [animation-delay:.08s] lg:min-h-0 lg:flex-1">
        <div className="scrollbar-slim min-h-0 flex-1 overflow-auto">
          {people.error && <p className="px-6 py-12 text-center text-sm text-muted">{t('admin.team.couldntLoad', { error: errorText(people.error) })}</p>}
          {!people.data && !people.error && <p className="px-6 py-12 text-center text-sm text-muted">{t('admin.team.loadingTeam')}</p>}
          {people.data && <TeamTable people={shown} />}
          {people.data && shown.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted">{t('admin.team.noMatch')}</p>}
        </div>
      </Card>

      <AddPersonDialog open={adding} onClose={() => setAdding(false)} onSave={add} />
      <PasswordResult result={password} onClose={() => setPassword(null)} />
    </div>
  )
}
