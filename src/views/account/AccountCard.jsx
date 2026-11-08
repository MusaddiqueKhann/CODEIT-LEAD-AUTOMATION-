import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { Row, Section, TextField } from '../../components/shared/index.js'
import { Badge, Button, Card, cx } from '../../components/ui/index.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { useCopy } from '../../controllers/shared/useCopy.js'
import { formatStamp, fromServer } from '../../models/rules/format.js'
import { CodeitPassword } from '../shared/member/CodeitPassword.jsx'
import { KeyButton, KeyField } from '../shared/member/KeyField.jsx'
import { Toggle } from '../shared/member/Toggle.jsx'

/* The built-in parts, whose line says what each means (member.accountCard.how.*); a part the Admin adds gets a plain line. */
const HOW = ['login', 'password', 'language']

/**
 * The Setup step: the details to create the customer's CODEIT account with (login, password,
 * language, which site), each ticked by the Account Member once set up on CODEIT, then "Mark
 * account as created" with the account's ID, and later whether the customer has signed in.
 */
export function AccountCard({ member: m, can, act }) {
  const { option, label, person, lists, brand } = useConfig()
  const { t } = useLang()
  const copy = useCopy()
  const [codeitId, setCodeitId] = useState('')
  const site = option('business_type', m.plan)?.meta.site
  const done = !!m.accountCreatedAt
  const maker = person(m.accountPersonId)?.name ?? t('member.accountCard.maker', { role: label('role', 'account') })
  // The Admin's list of parts (Settings → Lists); one that was turned off still shows where it was ticked.
  const parts = (lists.account_part ?? []).filter((o) => o.active || m.accountChecks?.[o.key] !== undefined)
  const field = (key) =>
    key === 'login' ? (
      <KeyField
        icon="user"
        tag={t('member.accountCard.loginId')}
        actions={<KeyButton icon="copy" label={t('member.accountCard.copy')} onClick={() => copy(m.email, t('member.accountCard.loginCopied'))} />}
      >
        {m.email}
      </KeyField>
    ) : key === 'password' ? (
      <CodeitPassword member={m} onNew={can.has('set_account') ? act.newPassword : null} />
    ) : key === 'language' ? (
      <KeyField
        icon="globe"
        actions={<span className="pe-2.5 text-xs whitespace-nowrap text-muted">{t(m.language === 'ar' ? 'member.accountCard.languageAr' : 'member.accountCard.languageEn')}</span>}
      >
        {t(m.language === 'ar' ? 'common.arabic' : 'common.english')}
      </KeyField>
    ) : (
      <KeyField icon="check">{t(m.accountChecks?.[key] || done ? 'member.accountCard.setUp' : 'member.accountCard.notYet')}</KeyField>
    )
  // A part's tick: the Account Member sets it while making the account; everyone else reads it.
  const tick = (key) => (
    <Toggle on={done || !!m.accountChecks?.[key]} label={t('member.accountCard.setUp')} disabled={done || !can.has('set_account') || act.busy} onChange={(on) => act.accountCheck(key, on)} />
  )

  return (
    <>
      <Section
        title={t('member.accountCard.title')}
        sub={t('member.accountCard.sub', { product: brand.product })}
        aside={<Badge tone={done ? 'success' : 'warn'}>{t(done ? 'member.accountCard.done' : 'member.accountCard.toDo')}</Badge>}
      >
        {parts.map((o) => (
          <Row key={o.key} title={label('account_part', o.key)} sub={HOW.includes(o.key) ? t(`member.accountCard.how.${o.key}`) : t('member.accountCard.how.other', { product: brand.product })}>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1">{field(o.key)}</span>
              {tick(o.key)}
            </div>
          </Row>
        ))}
        <Row title={t('member.accountCard.where')} sub={m.plan ? t('member.accountCard.whereSub', { plan: label('business_type', m.plan) }) : t('member.accountCard.pickType')}>
          {site ? (
            <KeyField icon="link" actions={<KeyButton icon="arrowUpRight" label={t('member.accountCard.openSite')} onClick={() => window.open(site, '_blank', 'noreferrer')} />}>
              {site.replace('https://', '')}
            </KeyField>
          ) : (
            <KeyField icon="link">—</KeyField>
          )}
        </Row>
        <Row title={t('member.accountCard.accountId', { product: brand.product })} sub={t('member.accountCard.accountIdSub', { product: brand.product })}>
          {done || !can.has('set_account') ? (
            <KeyField icon="shield">{m.codeitAccountId ?? '—'}</KeyField>
          ) : (
            <TextField label={t('member.accountCard.accountIdField')} dir="ltr" value={codeitId} onChange={(e) => setCodeitId(e.target.value)} />
          )}
        </Row>
      </Section>

      <Card
        as="section"
        padding="none"
        surface={done ? 'bg-[#eef7f1]' : undefined}
        className="flex animate-rise flex-wrap items-center gap-4 py-5 ps-6 pe-5 [animation-delay:.12s]"
      >
        <span className={cx('grid size-10 shrink-0 place-items-center rounded-full', done ? 'bg-success text-white' : 'bg-warn-bg text-warn-ink')}>
          <Icon name={done ? 'check' : 'clock'} className="size-4.5" strokeWidth={done ? 2.6 : 1.9} />
        </span>
        <span className="flex flex-[1_1_300px] flex-col gap-0.5">
          <span className={cx('text-[15px]', done ? 'text-success-ink' : 'text-ink')}>{t(done ? 'member.accountCard.created' : 'member.accountCard.notCreated')}</span>
          <span className={cx('text-[13px]', done ? 'text-[#3a5a48]' : 'text-muted')}>
            {done
              ? `${t('member.accountCard.markedBy', { name: maker, at: formatStamp(fromServer(m.accountCreatedAt)) })} ${m.stage === 'collecting' ? t('member.accountCard.readyTo', { step: label('step', m.integrations.length ? 'integration' : 'onboarding') }) : ''}`
              : can.has('set_account')
                ? t('member.accountCard.howToMark')
                : t('member.accountCard.waitingFor', { name: maker })}
          </span>
        </span>
        {!done && can.has('set_account') && (
          <Button size="lg" onClick={() => act.setAccount(codeitId)} disabled={!codeitId.trim() || act.busy}>
            <Icon name="check" className="size-4" strokeWidth={2.4} />
            {t('member.accountCard.mark')}
          </Button>
        )}
        {done && (can.has('customer_signin') || m.customerSignedInAt) && (
          <Toggle
            on={!!m.customerSignedInAt}
            label={m.customerSignedInAt ? t('member.accountCard.signedInAt', { at: formatStamp(fromServer(m.customerSignedInAt)) }) : t('member.accountCard.signedIn')}
            disabled={!can.has('customer_signin') || act.busy}
            onChange={act.signedIn}
          />
        )}
        {done && can.has('unset_account') && (
          <Button variant="outline" size="sm" onClick={act.unsetAccount} disabled={act.busy}>
            {t('member.accountCard.undo')}
          </Button>
        )}
      </Card>
    </>
  )
}
