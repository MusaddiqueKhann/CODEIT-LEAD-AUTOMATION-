import { useState } from 'react'
import { Badge, Button, Card, cx, Icon, Row, Section, TextField, TickPill } from '@/components'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { useCopy } from '../../controllers/shared/useCopy.js'
import { formatStamp, fromServer } from '../../models/rules/format.js'
import { CodeitPassword } from '../shared/member/CodeitPassword.jsx'
import { KeyButton, KeyField } from '../shared/member/KeyField.jsx'

/* The built-in parts, whose line says what each means (account.member.how.*); a part the Admin adds gets a plain line. */
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
  const maker = person(m.accountPersonId)?.name ?? t('account.member.maker', { role: label('role', 'account') })
  // The Admin's list of parts (Settings → Lists); one that was turned off still shows where it was ticked.
  const parts = (lists.account_part ?? []).filter((o) => o.active || m.accountChecks?.[o.key] !== undefined)
  const field = (key) =>
    key === 'login' ? (
      <KeyField
        icon="user"
        tag={t('account.member.loginId')}
        actions={<KeyButton id="account-card-copy" icon="copy" label={t('account.member.copy')} onClick={() => copy(m.email, t('account.member.loginCopied'))} />}
      >
        {m.email}
      </KeyField>
    ) : key === 'password' ? (
      <CodeitPassword member={m} onNew={can.has('set_account') ? act.newPassword : null} />
    ) : key === 'language' ? (
      <KeyField
        icon="globe"
        actions={<span className="pe-2.5 text-xs whitespace-nowrap text-muted">{t(m.language === 'ar' ? 'account.member.languageAr' : 'account.member.languageEn')}</span>}
      >
        {t(m.language === 'ar' ? 'shared.common.arabic' : 'shared.common.english')}
      </KeyField>
    ) : (
      <KeyField icon="check">{t(m.accountChecks?.[key] || done ? 'account.member.setUp' : 'account.member.notYet')}</KeyField>
    )
  // A part's tick: the Account Member sets it while making the account; everyone else reads it.
  const tick = (key) => (
    <TickPill id={`account-card-${key}`} on={done || !!m.accountChecks?.[key]} label={t('account.member.setUp')} disabled={done || !can.has('set_account') || act.busy} onChange={(on) => act.accountCheck(key, on)} />
  )

  return (
    <>
      <Section id="account-card-title"
        title={t('account.member.title')}
        sub={t('account.member.sub', { product: brand.product })}
        aside={<Badge tone={done ? 'success' : 'warn'}>{t(done ? 'account.member.done' : 'account.member.toDo')}</Badge>}
      >
        {parts.map((o) => (
          <Row key={o.key} title={label('account_part', o.key)} sub={HOW.includes(o.key) ? t(`account.member.how.${o.key}`) : t('account.member.how.other', { product: brand.product })}>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1">{field(o.key)}</span>
              {tick(o.key)}
            </div>
          </Row>
        ))}
        <Row title={t('account.member.where')} sub={m.plan ? t('account.member.whereSub', { plan: label('business_type', m.plan) }) : t('account.member.pickType')}>
          {site ? (
            <KeyField icon="link" actions={<KeyButton id="account-card-open-site" icon="arrowUpRight" label={t('account.member.openSite')} onClick={() => window.open(site, '_blank', 'noreferrer')} />}>
              {site.replace('https://', '')}
            </KeyField>
          ) : (
            <KeyField icon="link">—</KeyField>
          )}
        </Row>
        <Row title={t('account.member.accountId', { product: brand.product })} sub={t('account.member.accountIdSub', { product: brand.product })}>
          {done || !can.has('set_account') ? (
            <KeyField icon="shield">{m.codeitAccountId ?? '—'}</KeyField>
          ) : (
            <TextField id="account-card-account-id-field" label={t('account.member.accountIdField')} dir="ltr" value={codeitId} onChange={(e) => setCodeitId(e.target.value)} />
          )}
        </Row>
      </Section>

      <Card id="account-card-account"
        as="section"
        padding="none"
        surface={done ? 'bg-success-note' : undefined}
        className="flex animate-rise flex-wrap items-center gap-4 py-5 ps-6 pe-5 [animation-delay:.12s]"
      >
        <span className={cx('grid size-10 shrink-0 place-items-center rounded-full', done ? 'bg-success text-white' : 'bg-warn-bg text-warn-ink')}>
          <Icon name={done ? 'check' : 'clock'} className="size-4.5" strokeWidth={done ? 2.6 : 1.9} />
        </span>
        <span className="flex flex-[1_1_300px] flex-col gap-0.5">
          <span className={cx('text-[15px]', done ? 'text-success-ink' : 'text-ink')}>{t(done ? 'account.member.created' : 'account.member.notCreated')}</span>
          <span className={cx('text-[13px]', done ? 'text-success-note-ink' : 'text-muted')}>
            {done
              ? `${t('account.member.markedBy', { name: maker, at: formatStamp(fromServer(m.accountCreatedAt)) })} ${m.stage === 'collecting' ? t('account.member.readyTo', { step: label('step', m.integrations.length ? 'integration' : 'onboarding') }) : ''}`
              : can.has('set_account')
                ? t('account.member.howToMark')
                : t('account.member.waitingFor', { name: maker })}
          </span>
        </span>
        {!done && can.has('set_account') && (
          <Button id="account-card-mark" size="lg" onClick={() => act.setAccount(codeitId)} disabled={!codeitId.trim() || act.busy}>
            <Icon name="check" className="size-4" strokeWidth={2.4} />
            {t('account.member.mark')}
          </Button>
        )}
        {done && (can.has('customer_signin') || m.customerSignedInAt) && (
          <TickPill id="account-card-signed-in-at"
            on={!!m.customerSignedInAt}
            label={m.customerSignedInAt ? t('account.member.signedInAt', { at: formatStamp(fromServer(m.customerSignedInAt)) }) : t('account.member.signedIn')}
            disabled={!can.has('customer_signin') || act.busy}
            onChange={act.signedIn}
          />
        )}
        {done && can.has('unset_account') && (
          <Button id="account-card-undo" variant="outline" size="sm" onClick={act.unsetAccount} disabled={act.busy}>
            {t('account.member.undo')}
          </Button>
        )}
      </Card>
    </>
  )
}
