import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { Chips } from './Chips.jsx'
import { bind, toggle } from '../../models/rules/memberDraft.js'
import { Pair } from './Pair.jsx'
import { Row } from './Row.jsx'
import { Section } from './Section.jsx'
import { TextField } from './TextField.jsx'

/** Section 2 of the member form. Industries and sizes come from Settings → Lists. */
export function CompanyForm({ draft, set, n = 2, aside }) {
  const { active } = useConfig()
  const { t } = useLang()
  return (
    <Section id="company-details" n={n} title={t('shared.company.title')} sub={t('shared.company.sub')} aside={aside}>
      <Row title={t('shared.company.company')} sub={t('shared.company.companySub')}>
        <Pair>
          <TextField label={t('shared.company.name')} autoComplete="organization" {...bind(draft, set, 'company')} />
          <TextField label={t('shared.company.cr')} inputMode="numeric" dir="ltr" {...bind(draft, set, 'cr', (v) => v.replace(/\D/g, '').slice(0, 10))} />
          <TextField label={t('shared.company.vat')} inputMode="numeric" dir="ltr" {...bind(draft, set, 'vat', (v) => v.replace(/\D/g, '').slice(0, 15))} />
        </Pair>
      </Row>
      <Row title={t('shared.company.location')} sub={t('shared.company.locationSub')}>
        <Pair>
          <TextField label={t('shared.company.city')} autoComplete="address-level2" {...bind(draft, set, 'city')} />
          <TextField label={t('shared.company.website')} dir="ltr" placeholder="company.sa" {...bind(draft, set, 'website')} />
        </Pair>
      </Row>
      <Row title={t('shared.company.industry')} sub={t('shared.company.industrySub')}>
        <Chips list="industry" items={active('industry')} isOn={(k) => draft.industry === k} onPick={(k) => set({ industry: toggle(draft.industry, k) })} />
      </Row>
      <Row title={t('shared.company.size')} sub={t('shared.company.sizeSub')}>
        <Chips list="size" items={active('size')} isOn={(k) => draft.size === k} onPick={(k) => set({ size: toggle(draft.size, k) })} />
      </Row>
    </Section>
  )
}
