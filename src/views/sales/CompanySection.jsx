import { Pair, ReadField, Row, Section } from '../../components/shared/index.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'

/** Section 2: the company they are buying for. */
export function CompanySection({ member: m }) {
  const { label } = useConfig()
  const { t } = useLang()
  return (
    <Section id="company-details" n={2} title={t('member.company.title')} sub={t('member.company.sub')}>
      <Row title={t('member.company.company')} sub={t('member.company.companySub')}>
        <Pair>
          <ReadField label={t('member.company.name')}>{m.company}</ReadField>
          <ReadField label={t('member.company.cr')}>
            <bdi dir="ltr">{m.cr}</bdi>
          </ReadField>
          <ReadField label={t('member.company.vat')}>
            <bdi dir="ltr">{m.vat}</bdi>
          </ReadField>
        </Pair>
      </Row>
      <Row title={t('member.company.location')} sub={t('member.company.locationSub')}>
        <Pair>
          <ReadField label={t('member.company.city')}>{m.city}</ReadField>
          {m.website && (
            <ReadField label={t('member.company.website')}>
              <bdi dir="ltr">{m.website}</bdi>
            </ReadField>
          )}
        </Pair>
      </Row>
      <Row title={t('member.company.industry')} sub={t('member.company.industrySub')}>
        <Pair>
          <ReadField label={t('member.company.industry')}>{label('industry', m.industry)}</ReadField>
          <ReadField label={t('member.company.size')}>{label('size', m.size)}</ReadField>
        </Pair>
      </Row>
    </Section>
  )
}
