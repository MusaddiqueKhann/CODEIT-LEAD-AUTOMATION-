import Icon from '../Icon.jsx'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { Chips } from './Chips.jsx'
import { bind } from '../../models/rules/memberDraft.js'
import { Pair } from './Pair.jsx'
import { Row } from './Row.jsx'
import { Section } from './Section.jsx'
import { TextField } from './TextField.jsx'

/* The two languages the customer's emails and page come in (the texts table has one column each). */
const LANGUAGES = ['en', 'ar']

/**
 * Section 1 of the member form (Add a member, and the Sales tab). `n` numbers it. `password` is the
 * CODEIT password once the member exists; until then the server makes one when it's saved.
 */
export function AccountForm({ draft, set, n = 1, aside, password }) {
  const { brand } = useConfig()
  const { t } = useLang()
  return (
    <Section id="account-details" n={n} title={t('shared.account.title')} sub={t('shared.account.sub', { product: brand.product })} aside={aside}>
      <Row title={t('shared.account.fullName')} sub={t('shared.account.fullNameSub')}>
        <div className="grid grid-cols-2 gap-2.5">
          <TextField label={t('shared.account.firstName')} autoComplete="given-name" {...bind(draft, set, 'firstName')} />
          <TextField label={t('shared.account.lastName')} autoComplete="family-name" {...bind(draft, set, 'lastName')} />
        </div>
      </Row>
      <Row title={t('shared.account.contact')} sub={t('shared.account.contactSub')}>
        <Pair>
          <TextField label={t('shared.account.email')} type="email" dir="ltr" placeholder="name@example.com" autoComplete="email" {...bind(draft, set, 'email')} />
          <TextField label={t('shared.account.phone')} type="tel" dir="ltr" autoComplete="tel" {...bind(draft, set, 'phone')} />
        </Pair>
      </Row>
      <Row title={t('shared.account.password')} sub={t('shared.account.passwordSub')}>
        {password ?? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-muted">{t('shared.account.password')}</span>
            <span className="flex h-11 items-center gap-2.5 rounded-[14px] bg-field ps-2.5 pe-1.5">
              <span className="grid size-7.5 shrink-0 place-items-center rounded-[9px] bg-panel text-brand-700">
                <Icon name="lock" className="size-3.5" strokeWidth={1.9} />
              </span>
              <span className="text-sm text-muted">{t('shared.account.generated')}</span>
            </span>
          </div>
        )}
      </Row>
      <Row title={t('shared.account.language')} sub={t('shared.account.languageSub')}>
        <Chips items={LANGUAGES.map((k) => ({ key: k, label: t(`shared.account.${k}`) }))} isOn={(k) => draft.language === k} onPick={(k) => set({ language: k })} />
      </Row>
    </Section>
  )
}
