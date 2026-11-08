import { DocumentsPanel, FeaturesList, HardwareField, IntegrationsBox, Pair, ReadField, ReadyBy, Row, Section } from '@/components'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { documentsOf, featuresFor } from '../../models/rules/members.js'

/**
 * Section 3, to read: what they need and the files that go with it. Edit changes them.
 * `onHardware` keeps the hardware tracker working after Transfer (Sales and the Admin, until Closed).
 */
export function RequirementsSection({ member: m, openFile, onHardware }) {
  const { lists, label } = useConfig()
  const { t } = useLang()
  const { keys, state } = documentsOf(lists.document, m)
  const featureKeys = featuresFor(lists.feature, m.plan)

  return (
    <Section id="requirements" n={3} title={t('sales.member.requirements.title')} sub={t('sales.member.requirements.sub')}>
      <Row title={t('sales.member.requirements.businessType')} sub={t('sales.member.requirements.businessTypeSub')}>
        <ReadField>{m.plan ? label('business_type', m.plan) : t('sales.member.requirements.notPicked')}</ReadField>
      </Row>
      <Row title={t('sales.member.requirements.branchesUsers')} sub={t('sales.member.requirements.branchesUsersSub')}>
        <Pair>
          <ReadField label={t('sales.member.requirements.branches')}>{m.branches ?? '—'}</ReadField>
          <ReadField label={t('sales.member.requirements.users')}>{m.users ?? '—'}</ReadField>
        </Pair>
      </Row>
      {featureKeys.length > 0 && (
        <Row title={t('sales.member.requirements.features')} sub={t('sales.member.requirements.featuresSub')}>
          <FeaturesList keys={featureKeys} values={m.features} readOnly />
        </Row>
      )}
      <Row title={t('sales.member.requirements.integrations')} sub={t('sales.member.requirements.integrationsSub')}>
        <IntegrationsBox picked={m.integrations} readOnly />
      </Row>
      <Row title={t('sales.member.requirements.hardware')} sub={t('sales.member.requirements.hardwareSub')}>
        <HardwareField value={m.hardware} onChange={onHardware} readOnly={!onHardware} />
      </Row>
      <Row title={t('sales.member.requirements.documents')} sub={t('sales.member.requirements.documentsSub')}>
        <DocumentsPanel id="requirements-section-documents" keys={keys} files={m.files} due={m.due} readOnly openFile={openFile} empty={t('sales.member.requirements.noFiles')} />
      </Row>
      {keys.length > 0 && (
        <Row title={t('sales.member.requirements.readyBy')} sub={t('sales.member.requirements.readyBySub')}>
          <ReadyBy keys={keys} state={state} />
        </Row>
      )}
    </Section>
  )
}
