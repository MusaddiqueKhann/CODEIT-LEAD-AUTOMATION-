import { Pair, ReadField, Row, Section } from '../../components/shared/index.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { formatShort } from '../../models/rules/format.js'
import { CodeitPassword } from '../shared/member/CodeitPassword.jsx'

/** Section 1, to read: who they are, how to reach them, and the password for their account. */
export function AccountSection({ member: m }) {
  const { person, brand } = useConfig()
  const { t } = useLang()
  return (
    <Section id="account-details" n={1} title={t('member.account.title')} sub={t('member.account.sub', { product: brand.product })}>
      <Row title={t('member.account.fullName')} sub={t('member.account.fullNameSub')}>
        <Pair>
          <ReadField label={t('member.account.firstName')}>{m.firstName}</ReadField>
          <ReadField label={t('member.account.lastName')}>{m.lastName}</ReadField>
        </Pair>
      </Row>
      <Row title={t('member.account.contact')} sub={t('member.account.contactSub')}>
        <Pair>
          <ReadField label={t('member.account.email')}>
            <bdi dir="ltr">{m.email}</bdi>
          </ReadField>
          <ReadField label={t('member.account.phone')}>
            <bdi dir="ltr">{m.phone}</bdi>
          </ReadField>
          <ReadField label={t('member.account.language')}>{t(m.language === 'ar' ? 'common.arabic' : 'common.english')}</ReadField>
        </Pair>
      </Row>
      <Row title={t('member.account.password')} sub={t('member.account.passwordSub')}>
        <CodeitPassword member={m} />
      </Row>
      <Row title={t('member.account.memberId')} sub={t('member.account.memberIdSub')}>
        <ReadField>
          <bdi dir="ltr">{m.code}</bdi>
        </ReadField>
        <span className="text-[13px] text-muted">
          {t('member.account.added', { date: formatShort(m.createdAt), name: person(m.salesId)?.name ?? t('member.account.formerMember') })}
          {m.codeitAccountId && ` · ${t('member.account.productAccount', { product: brand.product, id: m.codeitAccountId })}`}
        </span>
      </Row>
    </Section>
  )
}
