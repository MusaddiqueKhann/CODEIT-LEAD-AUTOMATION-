import { Pair, ReadField, Row, Section } from '@/components'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'

/** Section 2: the company they are buying for. */
export function CompanySection({ member: m }) {
  const { label } = useConfig()
  const { t } = useLang()
  return (
    <Section id="company-details" n={2} title={t('sales.member.company.title')} sub={t('sales.member.company.sub')}>
      <Row title={t('sales.member.company.company')} sub={t('sales.member.company.companySub')}>
        <Pair>
          <ReadField label={t('sales.member.company.name')}>{m.company}</ReadField>
          <ReadField label={t('sales.member.company.cr')}>
            <bdi dir="ltr">{m.cr}</bdi>
          </ReadField>
          <ReadField label={t('sales.member.company.vat')}>
            <bdi dir="ltr">{m.vat}</bdi>
          </ReadField>
        </Pair>
      </Row>
      <Row title={t('sales.member.company.location')} sub={t('sales.member.company.locationSub')}>
        <Pair>
          <ReadField label={t('sales.member.company.city')}>{m.city}</ReadField>
          {m.website && (
            <ReadField label={t('sales.member.company.website')}>
              <bdi dir="ltr">{m.website}</bdi>
            </ReadField>
          )}
        </Pair>
      </Row>
      <Row title={t('sales.member.company.industry')} sub={t('sales.member.company.industrySub')}>
        <Pair>
          <ReadField label={t('sales.member.company.industry')}>{label('industry', m.industry)}</ReadField>
          <ReadField label={t('sales.member.company.size')}>{label('size', m.size)}</ReadField>
        </Pair>
      </Row>
    </Section>
  )
}
