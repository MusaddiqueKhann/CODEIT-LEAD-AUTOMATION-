import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { docState, docsFor, featuresFor } from '../../models/rules/members.js'
import { Chips } from './Chips.jsx'
import { DocumentsPanel } from './DocumentsPanel.jsx'
import { FeaturesList } from './FeaturesList.jsx'
import { HardwareField } from './HardwareField.jsx'
import { IntegrationsBox } from './IntegrationsBox.jsx'
import { bind, toggle } from '../../models/rules/memberDraft.js'
import { Pair } from './Pair.jsx'
import { ReadyBy } from './ReadyBy.jsx'
import { Row } from './Row.jsx'
import { Section } from './Section.jsx'
import { TextField } from './TextField.jsx'

/**
 * Section 3 of the member form: answers first (business type, counts, features, integrations,
 * hardware), then Documents lists exactly the files those answers need, and Ready by when they'll
 * all be in. Every list comes from Settings → Lists. `openFile(file)` gives a link to look at a file already stored;
 * `onRemove(key)` drops a file (by default only from the draft, for a file not saved yet).
 */
export function RequirementsForm({ draft, set, openFile, onRemove, n = 3, aside }) {
  const { active } = useConfig()
  const { t } = useLang()
  const docs = docsFor(active('document'), draft.plan, draft.integrations)
  const featureKeys = featuresFor(active('feature'), draft.plan)

  return (
    <Section id="requirements" n={n} title={t('shared.components.requirements.title')} sub={t('shared.components.requirements.sub')} aside={aside}>
      <Row title={t('shared.components.requirements.type')} sub={t('shared.components.requirements.typeSub')}>
        <Chips id="requirements-form-set" list="business_type" items={active('business_type')} isOn={(k) => draft.plan === k} onPick={(k) => set({ plan: toggle(draft.plan, k) })} />
      </Row>
      <Row title={t('shared.components.requirements.counts')} sub={t('shared.components.requirements.countsSub')}>
        <Pair>
          <TextField id="requirements-form-branches" label={t('shared.components.requirements.branches')} type="number" inputMode="numeric" min={1} {...bind(draft, set, 'branches')} />
          <TextField id="requirements-form-users" label={t('shared.components.requirements.users')} type="number" inputMode="numeric" min={1} {...bind(draft, set, 'users')} />
        </Pair>
      </Row>
      {featureKeys.length > 0 && (
        <Row title={t('shared.components.requirements.features')} sub={t('shared.components.requirements.featuresSub')}>
          <FeaturesList keys={featureKeys} values={draft.features} onChange={(k, v) => set({ features: { ...draft.features, [k]: v } })} />
        </Row>
      )}
      <Row title={t('shared.components.requirements.integrations')} sub={t('shared.components.requirements.integrationsSub')}>
        <IntegrationsBox
          picked={draft.integrations}
          onPick={(k) =>
            set({ integrations: draft.integrations.includes(k) ? draft.integrations.filter((x) => x !== k) : [...draft.integrations, k] })
          }
        />
      </Row>
      <Row title={t('shared.components.requirements.hardware')} sub={t('shared.components.requirements.hardwareSub')}>
        <HardwareField value={draft.hardware} onChange={(hardware) => set({ hardware })} />
      </Row>
      <Row title={t('shared.components.requirements.documents')} sub={t('shared.components.requirements.documentsSub')}>
        <DocumentsPanel id="requirements-form-documents"
          keys={docs}
          files={draft.files}
          onFile={(k, f) => set({ files: { ...draft.files, [k]: f } })}
          onRemove={onRemove ?? ((k) => set({ files: { ...draft.files, [k]: undefined } }))}
          due={draft.due}
          onDue={(k, days) => set({ due: { ...draft.due, [k]: days } })}
          openFile={openFile}
          empty={t('shared.components.requirements.noDocs')}
        />
      </Row>
      {docs.length > 0 && (
        <Row title={t('shared.components.requirements.readyBy')} sub={t('shared.components.requirements.readyBySub')}>
          <ReadyBy keys={docs} state={docState(draft.files, draft.due, docs)} />
        </Row>
      )}
    </Section>
  )
}
