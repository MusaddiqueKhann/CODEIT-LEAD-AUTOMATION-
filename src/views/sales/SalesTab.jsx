import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'
import { AccountForm, CompanyForm, RequirementsForm } from '../../components/shared/index.js'
import { Button } from '../../components/ui/index.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { toDraft } from '../../models/data/members.js'
import { formatStamp, fromServer } from '../../models/rules/format.js'
import { AccountSection } from './AccountSection.jsx'
import { CodeitPassword } from '../shared/member/CodeitPassword.jsx'
import { CompanySection } from './CompanySection.jsx'
import { EditBar } from './EditBar.jsx'
import { Notice } from '../shared/member/Notice.jsx'
import { ReadyCheckCard } from './ReadyCheckCard.jsx'
import { RequirementsSection } from './RequirementsSection.jsx'
import { SessionTime } from './SessionTime.jsx'

/**
 * Sales' step: why it came back (if it did), the Ready card with Transfer and Mark Lost, the
 * member's form as in the design, and the session time. Whoever may edit gets the form open to
 * type in, with a Save bar once something changed; everyone else reads the same sections. A link
 * ending in #ready or #pick-time lands on that card.
 */
export function SalesTab({ member: m, can, act, onTab }) {
  const { person } = useConfig()
  const { t } = useLang()
  const { hash } = useLocation()
  const [draft, setDraft] = useState(null)
  const form = draft ?? toDraft(m)
  const set = (patch) => setDraft((d) => ({ ...(d ?? toDraft(m)), ...patch }))
  const editing = can.has('edit')
  const collecting = m.stage === 'collecting' && !m.outcome

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  const save = async () => {
    if (await act.save(form)) setDraft(null)
  }
  // Booking checks the saved files' date, so unsaved changes go first.
  const book = async (at) => {
    if (draft) {
      if (!(await act.save(form))) return false
      setDraft(null)
    }
    return act.book(at)
  }
  // A stored file is removed on the server; one only picked here just goes back to what is stored.
  const removeFile = async (kind) => {
    if (!form.files[kind]?.path) return set({ files: { ...form.files, [kind]: m.files[kind] } })
    if (await act.removeDocument(kind)) setDraft((d) => d && { ...d, files: { ...d.files, [kind]: undefined } })
  }

  return (
    <>
      {collecting && m.sentBackReason && (
        <Notice tone="warn" icon="refresh">
          {t('member.sentBack', { name: person(m.sentBackBy)?.name ?? t('member.someone'), at: formatStamp(fromServer(m.sentBackAt)), reason: m.sentBackReason })}
        </Notice>
      )}
      {collecting && <ReadyCheckCard member={m} can={can} act={act} onTab={onTab} />}
      {editing ? (
        <>
          <AccountForm draft={form} set={set} aside={<Pencil />} password={<CodeitPassword member={m} onNew={act.newPassword} />} />
          <CompanyForm draft={form} set={set} aside={<Pencil />} />
          <RequirementsForm draft={form} set={set} openFile={act.openFile} onRemove={removeFile} aside={<Pencil />} />
        </>
      ) : (
        <>
          <AccountSection member={m} />
          <CompanySection member={m} />
          <RequirementsSection member={m} openFile={act.openFile} onHardware={can.has('hardware') ? act.hardware : null} />
        </>
      )}
      <SessionTime member={m} draft={form} set={editing ? set : null} canBook={can.has('book')} onBook={book} busy={act.busy} />
      {draft && <EditBar busy={act.busy} onSave={save} onCancel={() => setDraft(null)} />}
    </>
  )
}

/** The round pencil on each section: puts the cursor in its first field. */
function Pencil() {
  const { t } = useLang()
  return (
    <Button
      variant="bare"
      aria-label={t('member.editSection')}
      onClick={(e) => e.currentTarget.closest('section').querySelector('input, [aria-pressed]')?.focus()}
      className="grid size-10 shrink-0 place-items-center rounded-full text-ink ring-[1.5px] ring-edge transition ring-inset hover:bg-surface"
    >
      <Icon name="pencil" className="size-4" strokeWidth={1.8} />
    </Button>
  )
}
