import { useState } from 'react'
import Icon from '../../../components/Icon.jsx'
import { PageHeader } from '../../../components/layout/PageHeader.jsx'
import { PasswordResult, SearchBox } from '../../../components/shared/index.js'
import { Button, Card } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import * as team from '../../../models/data/team.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { useRows } from '../../../controllers/shared/useRows.js'
import { AddPersonDialog } from './AddPersonDialog.jsx'
import { TeamTable } from './TeamTable.jsx'

/** The Admin's team: who is on it, their role and status. A row opens their page, where the people actions are. */
export function TeamPage() {
  const config = useConfig()
  const { t, errorText } = useLang()
  const people = useRows(team.teamOverview, 'team')
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
      setPassword({ ...r, title: t('team.onTeam', { name: form.name }), name: form.name, email: form.email.trim().toLowerCase() })
    })

  /* Search finds a name, an email or a role's name. */
  const q = query.trim().toLowerCase()
  const shown = (people.data ?? []).filter((p) => !q || [p.name, p.email, config.label('role', p.role)].some((v) => v.toLowerCase().includes(q)))

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-2rem)]">
      <PageHeader
        title={t('team.title')}
        sub={people.data ? t('team.activeSub', { n: people.data.filter((p) => p.active && !p.mustChangePassword && !p.onLeaveUntil).length }) : t('common.loading')}
        actions={
          <Button size="lg" onClick={() => setAdding(true)}>
            <Icon name="plus" className="size-4" strokeWidth={2.2} />
            {t('team.addPerson')}
          </Button>
        }
      >
        <SearchBox value={query} onChange={setQuery} placeholder={t('team.searchPlaceholder')} label={t('team.searchLabel')} className="flex-[0_1_340px]" />
      </PageHeader>
      <Card padding="none" clip className="flex animate-rise flex-col [animation-delay:.08s] lg:min-h-0 lg:flex-1">
        <div className="scrollbar-slim min-h-0 flex-1 overflow-auto">
          {people.error && <p className="px-6 py-12 text-center text-sm text-muted">{t('team.couldntLoad', { error: errorText(people.error) })}</p>}
          {!people.data && !people.error && <p className="px-6 py-12 text-center text-sm text-muted">{t('team.loadingTeam')}</p>}
          {people.data && <TeamTable people={shown} />}
          {people.data && shown.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted">{t('team.noMatch')}</p>}
        </div>
      </Card>

      <AddPersonDialog open={adding} onClose={() => setAdding(false)} onSave={add} />
      <PasswordResult result={password} onClose={() => setPassword(null)} />
    </div>
  )
}
