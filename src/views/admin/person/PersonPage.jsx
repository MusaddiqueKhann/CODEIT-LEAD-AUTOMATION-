import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { PageHeader } from '../../../components/layout/PageHeader.jsx'
import { LeaveDialog, PasswordResult } from '../../../components/shared/index.js'
import { Avatar, Button, ConfirmDialog, cx } from '../../../components/ui/index.js'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import * as team from '../../../models/data/team.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { useMembers } from '../../../controllers/shared/useMembers.js'
import { useRows } from '../../../controllers/shared/useRows.js'
import { dayKey, formatShort, fromDay, riyadhNow } from '../../../models/rules/format.js'
import { ROUTES } from '../../../routes/paths.js'
import { initials } from '../../../models/rules/time.js'
import { TONES } from '../../../components/tones.js'
import { statusOf } from '../../../models/rules/personStatus.js'
import { BusyFree } from './BusyFree.jsx'
import { EditPersonDialog } from './EditPersonDialog.jsx'
import { HoursCard } from './HoursCard.jsx'
import { MoveMembersDialog } from './MoveMembersDialog.jsx'
import { PersonMembers } from './PersonMembers.jsx'
import { PersonTiles } from './PersonTiles.jsx'
import { loadOf } from '../../../models/rules/members.js'
import { hoursOf, leaveOn, openWith, thisWeek } from '../../../models/rules/week.js'

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
  const people = useRows(team.teamOverview, 'team')
  const members = useMembers()
  const leave = useRows(() => team.listLeave(id), `leave:${id}`)
  const { run } = useAction(() => {
    people.reload()
    leave.reload()
    config.reload()
  })
  const [dialog, setDialog] = useState(null) // 'leave' | 'edit' | 'move' | 'deactivate'
  const [password, setPassword] = useState(null)

  if (people.error) return <p className="px-6 py-12 text-center text-sm text-muted">{t('team.couldntLoad', { error: errorText(people.error) })}</p>
  if (!people.data || !members.data || !leave.data) return <p className="px-6 py-12 text-center text-sm text-muted">{t('common.loading')}</p>
  const p = people.data.find((x) => x.id === id)
  if (!p) return <Navigate to={ROUTES.team} replace />

  const hours = hoursOf(p, config.settings.officeHours)
  const away = leaveOn(leave.data, dayKey(riyadhNow()))
  const open = openWith(members.data, p.id)
  const [status, tone] = statusOf(p, t)

  return (
    <>
      <PageHeader
        back={ROUTES.team}
        media={<Avatar initials={initials(p.name)} size="lg" className="size-13 text-base" />}
        title={p.name}
        sub={
          <span className="flex flex-wrap items-center gap-2.5 text-soft">
            {config.label('role', p.role)}
            <span className="size-0.75 rounded-full bg-[#c9ced6]" />
            <span dir="ltr">{p.email}</span>
          </span>
        }
        actions={
          <>
            <span className={cx('inline-flex h-7.5 items-center rounded-full px-3 text-xs whitespace-nowrap', TONES[tone].fill, TONES[tone].text)}>{status}</span>
            {p.lockedUntil && p.active && (
              <Button variant="bare" className={HEAD_BUTTON} onClick={() => run(() => team.unlockPerson(p.id), t('person.unlocked', { name: p.name }))}>
                <Icon name="lock" className="size-4" strokeWidth={1.8} />
                {t('person.unlock')}
              </Button>
            )}
            <Button
              variant="bare"
              className={HEAD_BUTTON}
              onClick={() => (away ? run(() => team.removeLeave(away.id), t('person.back', { name: p.name })) : setDialog('leave'))}
            >
              {away ? t('person.markBack') : t('person.setLeave')}
            </Button>
            <Button variant="bare" className={HEAD_BUTTON} onClick={() => setDialog('edit')}>
              <Icon name="pencil" className="size-4" strokeWidth={1.8} />
              {t('common.edit')}
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
          onSaveHours={(h) => run(() => team.setHours(p.id, h), t('person.hoursSaved'))}
          onSaveNote={(note) => run(() => team.setTeamNote(p.id, note), t('person.noteSaved'))}
        />
      </div>

      <BusyFree person={p} hours={hours} week={thisWeek()} leave={leave.data} members={members.data} />

      <LeaveDialog
        open={dialog === 'leave'}
        onClose={() => setDialog(null)}
        name={p.name}
        onSave={(from, to) => run(() => team.addLeave(p.id, from, to), t('person.leaveAdded', { name: p.name }))}
      />
      <EditPersonDialog
        person={dialog === 'edit' ? p : null}
        me={profile.id}
        onClose={() => setDialog(null)}
        onSave={(role) => run(() => team.setRole(p.id, role), t('person.roleChanged', { name: p.name, role: config.label('role', role) }))}
        on={{
          email: (email) =>
            run(
              () => team.changeEmail(p.id, email),
              (r) => t(r.emailed ? 'person.emailChanged' : 'person.emailChangedNotSent', { name: p.name, email }),
            ),
          reset: () =>
            run(async () => {
              const r = await team.resetPassword(p.id)
              setPassword({ ...r, title: t('person.newPassword'), name: p.name, email: p.email })
            }),
          move: () => setDialog('move'),
          deactivate: () => setDialog('deactivate'),
          reactivate: () => run(() => team.setActive(p.id, true), t('person.canSignIn', { name: p.name })),
        }}
      />
      <MoveMembersDialog
        person={dialog === 'move' ? p : null}
        onClose={() => setDialog(null)}
        onMove={(to) => run(async () => team.moveMembers(p.id, to), t('person.moved'))}
      />
      <ConfirmDialog
        open={dialog === 'deactivate'}
        onClose={() => setDialog(null)}
        onConfirm={() => run(() => team.setActive(p.id, false), t('person.cantSignIn', { name: p.name }))}
        title={t('person.deactivateTitle', { name: p.name })}
        description={p.openCount ? t('person.deactivateOpen', { n: p.openCount }) : t('person.deactivateNone')}
        confirmLabel={t('person.deactivate')}
      />
      <PasswordResult result={password} onClose={() => setPassword(null)} />
    </>
  )
}
