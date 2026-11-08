import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Avatar, Badge, Button, ConfirmDialog, Icon, LeaveDialog, PageHeader, PasswordResult } from '@/components'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import * as team from '../../../controllers/admin/team.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { useMembers } from '../../../controllers/shared/useMembers.js'
import { dayKey, formatShort, fromDay, riyadhNow } from '../../../models/rules/format.js'
import { ROUTES } from '../../../routes/paths.js'
import { initials } from '../../../models/rules/time.js'
import { personStatus } from '../../../models/rules/personStatus.js'
import { BusyFree } from './BusyFree.jsx'
import { EditPersonDialog } from './EditPersonDialog.jsx'
import { HoursCard } from './HoursCard.jsx'
import { MoveMembersDialog } from './MoveMembersDialog.jsx'
import { PersonMembers } from './PersonMembers.jsx'
import { PersonTiles } from './PersonTiles.jsx'
import { loadOf } from '../../../models/rules/members.js'
import { hoursOf, leaveOn, openWith, thisWeek } from '../../../models/rules/week.js'
import { useTeam } from '../../../controllers/admin/team.js'
import { useLeave } from '../../../controllers/shared/useLeave.js'

const HEAD_BUTTON = 'flex h-10 items-center gap-2 rounded-[14px] bg-surface px-4 text-[13px] whitespace-nowrap text-ink transition hover:bg-surface-hover'

/**
 * One team member for the Admin: their load, their members, their hours and their week. Edit holds
 * the role and the account jobs (new password, move their members, deactivate).
 */
export function PersonPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const config = useConfig()
  const { t, errorText } = useLang()
  const people = useTeam()
  const members = useMembers()
  const leave = useLeave(id)
  const { run } = useAction(() => {
    people.reload()
    leave.reload()
    config.reload()
  })
  const [dialog, setDialog] = useState(null) // 'leave' | 'edit' | 'move' | 'deactivate'
  const [password, setPassword] = useState(null)

  if (people.error) return <p className="px-6 py-12 text-center text-sm text-muted">{t('admin.team.couldntLoad', { error: errorText(people.error) })}</p>
  if (!people.data || !members.data || !leave.data) return <p className="px-6 py-12 text-center text-sm text-muted">{t('shared.common.loading')}</p>
  const p = people.data.find((x) => x.id === id)
  if (!p) return <Navigate to={ROUTES.team} replace />

  const hours = hoursOf(p, config.settings.officeHours)
  const away = leaveOn(leave.data, dayKey(riyadhNow()))
  const open = openWith(members.data, p.id)
  const [status, tone] = personStatus(p, t)

  return (
    <>
      <PageHeader
        back={ROUTES.team}
        media={<Avatar initials={initials(p.name)} size="lg" className="size-13 text-base" />}
        title={p.name}
        sub={
          <span className="flex flex-wrap items-center gap-2.5 text-soft">
            {config.label('role', p.role)}
            <span className="size-0.75 rounded-full bg-off-ring" />
            <span dir="ltr">{p.email}</span>
          </span>
        }
        actions={
          <>
            <Badge size="tall" tone={tone}>{status}</Badge>
            {p.lockedUntil && p.active && (
              <Button id="person-page-unlock" variant="bare" className={HEAD_BUTTON} onClick={() => run(() => team.unlockPerson(p.id), t('admin.person.unlocked', { name: p.name }))}>
                <Icon name="lock" className="size-4" strokeWidth={1.8} />
                {t('admin.person.unlock')}
              </Button>
            )}
            <Button id="person-page-mark-back"
              variant="bare"
              className={HEAD_BUTTON}
              onClick={() => (away ? run(() => team.removeLeave(away.id), t('admin.person.back', { name: p.name })) : setDialog('leave'))}
            >
              {away ? t('admin.person.markBack') : t('admin.person.setLeave')}
            </Button>
            <Button id="person-page-edit" variant="bare" className={HEAD_BUTTON} onClick={() => setDialog('edit')}>
              <Icon name="pencil" className="size-4" strokeWidth={1.8} />
              {t('shared.common.edit')}
            </Button>
          </>
        }
      />

      <PersonTiles person={p} open={open} all={members.data} />

      <div className="flex flex-wrap items-stretch gap-4">
        <PersonMembers person={p} open={open} load={loadOf(members.data, p)} />
        <HoursCard
          key={p.id}
          person={p}
          hours={hours}
          leaveUntil={away && formatShort(fromDay(away.endsOn))}
          onSaveHours={(h) => run(() => team.setHours(p.id, h), t('admin.person.hoursSaved'))}
          onSaveNote={(note) => run(() => team.setTeamNote(p.id, note), t('admin.person.noteSaved'))}
        />
      </div>

      <BusyFree person={p} hours={hours} week={thisWeek()} leave={leave.data} members={members.data} />

      <LeaveDialog
        open={dialog === 'leave'}
        onClose={() => setDialog(null)}
        name={p.name}
        onSave={(from, to) => run(() => team.addLeave(p.id, from, to), t('admin.person.leaveAdded', { name: p.name }))}
      />
      <EditPersonDialog
        person={dialog === 'edit' ? p : null}
        me={profile.id}
        onClose={() => setDialog(null)}
        onSave={(role) => run(() => team.setRole(p.id, role), t('admin.person.roleChanged', { name: p.name, role: config.label('role', role) }))}
        on={{
          email: (email) =>
            run(
              () => team.changeEmail(p.id, email),
              (r) => t(r.emailed ? 'admin.person.emailChanged' : 'admin.person.emailChangedNotSent', { name: p.name, email }),
            ),
          reset: () =>
            run(async () => {
              const r = await team.resetPassword(p.id)
              setPassword({ ...r, title: t('admin.person.newPassword'), name: p.name, email: p.email })
            }),
          move: () => setDialog('move'),
          deactivate: () => setDialog('deactivate'),
          reactivate: () => run(() => team.setActive(p.id, true), t('admin.person.canSignIn', { name: p.name })),
        }}
      />
      <MoveMembersDialog
        person={dialog === 'move' ? p : null}
        onClose={() => setDialog(null)}
        onMove={(to) => run(async () => team.moveMembers(p.id, to), t('admin.person.moved'))}
      />
      <ConfirmDialog id="person-page-deactivate-title"
        open={dialog === 'deactivate'}
        onClose={() => setDialog(null)}
        onConfirm={() => run(() => team.setActive(p.id, false), t('admin.person.cantSignIn', { name: p.name }))}
        title={t('admin.person.deactivateTitle', { name: p.name })}
        description={p.openCount ? t('admin.person.deactivateOpen', { n: p.openCount }) : t('admin.person.deactivateNone')}
        confirmLabel={t('admin.person.deactivate')}
      />
      <PasswordResult result={password} onClose={() => setPassword(null)} />
    </>
  )
}
