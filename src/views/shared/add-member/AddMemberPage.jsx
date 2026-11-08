import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader.jsx'
import { AccountForm, CompanyForm, PickTimeSection, RequirementsForm } from '../../../components/shared/index.js'
import { EMAIL, EMPTY } from '../../../models/rules/memberDraft.js'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useToast } from '../../../controllers/shared/ToastContext.jsx'
import { addMember } from '../../../models/data/members.js'
import { ROUTES, memberPath } from '../../../routes/paths.js'
import { SalesOwnerPicker } from './SalesOwnerPicker.jsx'
import { SaveBar } from './SaveBar.jsx'

/** Add a member: account, company, requirements and a session time on one page. */
export function AddMemberPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { settings, label, brand } = useConfig()
  const { t, errorText } = useLang()
  const { toast } = useToast()
  const [draft, setDraft] = useState(() => ({ ...EMPTY, phone: settings.phonePrefix }))
  const [salesId, setSalesId] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const admin = role === 'admin'

  const missing = [
    admin && !salesId && 'salesOwner',
    !(draft.firstName.trim() && draft.lastName.trim()) && 'name',
    !EMAIL.test(draft.email.trim()) && 'email',
    draft.phone.replace(/\D/g, '').length < settings.phoneMinDigits && 'phone',
    !draft.company.trim() && 'company',
  ]
    .filter(Boolean)
    .map((k) => t(`members.add.missing.${k}`))

  const save = async () => {
    setBusy(true)
    try {
      const r = await addMember(draft, admin ? salesId : null)
      toast(
        r.account === 'nobody'
          ? t('members.add.savedNobody', { code: r.code, admin: label('role', 'admin'), account: label('role', 'account') })
          : t('members.add.saved', { code: r.code, person: r.account, product: brand.product }),
      )
      if (r.phoneMatch) toast(t('members.add.phoneMatch', { match: r.phoneMatch }), 'warn')
      for (const e of r.uploadErrors) toast(e, 'danger')
      navigate(memberPath(r.code))
    } catch (err) {
      toast(errorText(err), 'danger')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        back={ROUTES.members}
        title={t('layout.nav.addMember')}
        sub={t(admin ? 'members.add.subAdmin' : 'members.add.subSales', { account: label('role', 'account'), product: brand.product })}
      />
      {admin && <SalesOwnerPicker value={salesId} onChange={setSalesId} />}
      <AccountForm draft={draft} set={set} />
      <CompanyForm draft={draft} set={set} />
      <RequirementsForm draft={draft} set={set} />
      <PickTimeSection draft={draft} set={set} value={draft.slot} onChange={(slot) => set({ slot })} />
      <SaveBar slot={draft.slot} length={settings.sessionMinutes} missing={missing} busy={busy} onCancel={() => navigate(ROUTES.members)} onSave={save} />
    </div>
  )
}
