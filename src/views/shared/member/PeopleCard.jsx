import { useState } from 'react'
import { PersonPicker } from '../../../components/shared/index.js'
import { Avatar, Button, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { initials } from '../../../models/rules/time.js'
import { Panel } from './Panel.jsx'

const ROLES = [
  ['sales', 'salesId'],
  ['account', 'accountPersonId'],
  ['integration', 'integrationId'],
  ['onboarding', 'onboardingId'],
]

/** Who is on this member, which of them has it now, and (Admin) Change on each. */
export function PeopleCard({ member: m, can, act }) {
  const { label, person } = useConfig()
  const { t } = useLang()
  const [changing, setChanging] = useState(null)
  const [options, setOptions] = useState(null)

  const open = async (role) => {
    setOptions(null)
    setChanging(role)
    setOptions(await act.options(role))
  }

  const empty = (role) =>
    role === 'integration' ? t(m.integrations.length ? 'member.people.atTransfer' : 'member.people.noIntegration')
    : role === 'onboarding' ? t('member.people.atHandover')
    : t('member.people.nobody')

  return (
    <Panel title={t('member.people.title')} sub={t('member.people.sub')} className="flex-[1_1_320px]">
      <ul className="-mt-1 flex flex-col">
        {ROLES.map(([role, key]) => {
          const p = person(m[key])
          const holds = m.holderId && m.holderId === m[key]
          const auto = p && m.autoPicked.includes(role)
          return (
            <li key={role} className="flex items-center gap-3 border-b border-[#e9edf3] py-2.5 last:border-b-0">
              {p ? (
                <Avatar initials={initials(p.name)} size="sm" className={cx('size-10', holds && 'bg-brand-700')} />
              ) : (
                <span className="size-10 shrink-0 rounded-full bg-surface ring-[1.5px] ring-[#dfe3ea] ring-inset" />
              )}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-xs text-faint">{label('role', role)}</span>
                <span className={cx('truncate text-sm', p ? 'text-ink' : 'text-faint')}>{p ? p.name : empty(role)}</span>
              </span>
              {(holds || auto) && (
                <span className={cx('inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] whitespace-nowrap', holds ? 'bg-tint text-brand-800' : 'bg-surface text-soft')}>
                  {t(holds ? 'member.people.hasIt' : 'member.people.auto')}
                </span>
              )}
              {can.has('change_person') && (role !== 'account' || !m.accountCreatedAt) && (
                <Button variant="bare" onClick={() => open(role)} className="h-8.5 shrink-0 rounded-[10px] bg-surface px-3 text-xs text-ink transition hover:bg-surface-hover">
                  {t('member.people.change')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      <PersonPicker
        open={changing !== null}
        onClose={() => setChanging(null)}
        title={changing && t('member.people.changeTitle', { role: label('role', changing) })}
        options={options}
        current={changing && m[ROLES.find(([r]) => r === changing)[1]]}
        onPick={(id) => act.changePerson(changing, id)}
      />
    </Panel>
  )
}
