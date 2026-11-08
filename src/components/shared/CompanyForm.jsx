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
    <Section id="company-details" n={n} title={t('shared.components.company.title')} sub={t('shared.components.company.sub')} aside={aside}>
      <Row title={t('shared.components.company.company')} sub={t('shared.components.company.companySub')}>
        <Pair>
          <TextField id="company-form-name" label={t('shared.components.company.name')} autoComplete="organization" {...bind(draft, set, 'company')} />
          <TextField id="company-form-cr" label={t('shared.components.company.cr')} inputMode="numeric" dir="ltr" {...bind(draft, set, 'cr', (v) => v.replace(/\D/g, '').slice(0, 10))} />
          <TextField id="company-form-vat" label={t('shared.components.company.vat')} inputMode="numeric" dir="ltr" {...bind(draft, set, 'vat', (v) => v.replace(/\D/g, '').slice(0, 15))} />
        </Pair>
      </Row>
      <Row title={t('shared.components.company.location')} sub={t('shared.components.company.locationSub')}>
        <Pair>
          <TextField id="company-form-city" label={t('shared.components.company.city')} autoComplete="address-level2" {...bind(draft, set, 'city')} />
          <TextField id="company-form-website" label={t('shared.components.company.website')} dir="ltr" placeholder={t('shared.components.company.websiteHint')} {...bind(draft, set, 'website')} />
        </Pair>
      </Row>
      <Row title={t('shared.components.company.industry')} sub={t('shared.components.company.industrySub')}>
        <Chips id="company-form-set" list="industry" items={active('industry')} isOn={(k) => draft.industry === k} onPick={(k) => set({ industry: toggle(draft.industry, k) })} />
      </Row>
      <Row title={t('shared.components.company.size')} sub={t('shared.components.company.sizeSub')}>
        <Chips id="company-form-set-2" list="size" items={active('size')} isOn={(k) => draft.size === k} onPick={(k) => set({ size: toggle(draft.size, k) })} />
      </Row>
    </Section>
  )
}
