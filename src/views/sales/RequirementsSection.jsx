import {
  DocumentsPanel,
  FeaturesList,
  HardwareField,
  IntegrationsBox,
  Pair,
  ReadField,
  ReadyBy,
  Row,
  Section,
} from '../../components/shared/index.js'
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
    <Section id="requirements" n={3} title={t('member.requirements.title')} sub={t('member.requirements.sub')}>
      <Row title={t('member.requirements.businessType')} sub={t('member.requirements.businessTypeSub')}>
        <ReadField>{m.plan ? label('business_type', m.plan) : t('member.requirements.notPicked')}</ReadField>
      </Row>
      <Row title={t('member.requirements.branchesUsers')} sub={t('member.requirements.branchesUsersSub')}>
        <Pair>
          <ReadField label={t('member.requirements.branches')}>{m.branches ?? '—'}</ReadField>
          <ReadField label={t('member.requirements.users')}>{m.users ?? '—'}</ReadField>
        </Pair>
      </Row>
      {featureKeys.length > 0 && (
        <Row title={t('member.requirements.features')} sub={t('member.requirements.featuresSub')}>
          <FeaturesList keys={featureKeys} values={m.features} readOnly />
        </Row>
      )}
      <Row title={t('member.requirements.integrations')} sub={t('member.requirements.integrationsSub')}>
        <IntegrationsBox picked={m.integrations} readOnly />
      </Row>
      <Row title={t('member.requirements.hardware')} sub={t('member.requirements.hardwareSub')}>
        <HardwareField value={m.hardware} onChange={onHardware} readOnly={!onHardware} />
      </Row>
      <Row title={t('member.requirements.documents')} sub={t('member.requirements.documentsSub')}>
        <DocumentsPanel keys={keys} files={m.files} due={m.due} readOnly openFile={openFile} empty={t('member.requirements.noFiles')} />
      </Row>
      {keys.length > 0 && (
        <Row title={t('member.requirements.readyBy')} sub={t('member.requirements.readyBySub')}>
          <ReadyBy keys={keys} state={state} />
        </Row>
      )}
    </Section>
  )
}
