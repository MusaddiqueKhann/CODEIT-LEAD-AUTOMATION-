import { useState } from 'react'
import Icon from '../../../components/Icon.jsx'
import { Option } from '../../../components/shared/index.js'
import { Button, ConfirmDialog, Field, Input, Modal, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useToast } from '../../../controllers/shared/ToastContext.jsx'
import { saveOption } from '../../../models/data/settings.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { FILE_TYPES } from '../../../models/rules/members.js'
import { Section } from './Section.jsx'
import { useShownNow } from './useShownNow.js'

/* Each file type's badge colours; its letters and name are settings.docs.badges/types.<type>. */
const BADGE = { pdf: 'bg-danger-bg text-danger-ink', image: 'bg-indigo-bg text-indigo-ink', excel: 'bg-success-bg text-success-ink', any: 'bg-surface-2 text-soft' }
const slug = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x))
const typeOf = (d) => (d.meta.type in FILE_TYPES ? d.meta.type : 'any')
/** A document's meta with `field` set to `value`, or without it when `value` is null. */
const withField = (meta, field, value) => {
  const rest = { ...meta }
  delete rest[field]
  return value === null ? rest : { ...rest, [field]: value }
}

/**
 * Admin: what each customer must send, as two tables of ticks: the customer types that send each
 * document, and the integrations that need it. A document's `plans` are its customer types (none
 * listed: every type, so a new type gets it too; an empty list: none) and its `integrations` the
 * integrations that need it. Every change saves at once, with Undo; Add and Edit open popups.
 */
export function DocumentsSection({ after }) {
  const { lists, active, label: name } = useConfig()
  const { shown: all, show, drop } = useShownNow(lists.document ?? [])
  const { t } = useLang()
  const { toast } = useToast()
  const { run } = useAction(after)
  const [editing, setEditing] = useState(null) // the document being edited, while its popup is open
  const [adding, setAdding] = useState(null)
  const [removing, setRemoving] = useState(null)
  const docs = all.filter((d) => d.active)
  const types = active('business_type').map((o) => o.key)
  const integrations = active('integration').map((o) => o.key)
  const label = (k) => (types.includes(k) ? name('business_type', k) : name('integration', k))
  const typesOf = (d) => (d.meta.plans ?? types).filter((k) => types.includes(k))
  const byType = docs.filter((d) => typesOf(d).length > 0 || !d.meta.integrations?.length)
  const byIntegration = docs.filter((d) => d.meta.integrations?.length > 0)

  /** Saves one document; the toast offers Undo back to how it was. Resolves whether it saved. */
  const save = async (next, message = t('settings.docs.saved')) => {
    const before = (lists.document ?? []).find((d) => d.key === next.key)
    if (before) show(next)
    const done = await run(() => saveOption('document', next))
    if (done) toast(message, 'success', before ? { label: t('common.undo'), onClick: () => run(() => saveOption('document', before)) } : null)
    else drop(next.key)
    return done
  }
  const refuse = (words) => {
    toast(words, 'danger')
    return false
  }
  const tickType = (d, type) => {
    const now = typesOf(d)
    const next = now.includes(type) ? now.filter((k) => k !== type) : [...now, type]
    if (!next.length && !d.meta.integrations?.length) return refuse(t('settings.docs.needType'))
    // Every type ticked: no list at all, so a customer type added later asks for it too.
    return save({ ...d, meta: withField(d.meta, 'plans', same(next, types) ? null : next) })
  }
  const tickIntegration = (d, key) => {
    const now = d.meta.integrations ?? []
    const next = now.includes(key) ? now.filter((k) => k !== key) : [...now, key]
    if (!next.length && !typesOf(d).length) return refuse(t('settings.docs.needIntegration'))
    return save({ ...d, meta: withField(d.meta, 'integrations', next.length ? next : null) })
  }

  /** Takes a document that customer types send off the integrations (the bin in the integrations table). */
  const offIntegrations = (d) => save({ ...d, meta: withField(d.meta, 'integrations', null) }, t('settings.docs.offIntegrations', { name: d.label }))

  const table = (title, sub, cols, rows, ticked, onTick) => (
    <div className="flex flex-col gap-3">
      <span className="flex flex-col gap-0.5">
        <h3 className="text-[17px] text-ink">{title}</h3>
        <span className="text-[13px] text-muted">{sub}</span>
      </span>
      {/* Each column at a glance: how many it must send, of how many it's asked for. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
        {cols.map((k) => {
          const asked = rows.filter((d) => ticked(d, k))
          return (
            <div key={k} className="flex items-center justify-between gap-3 rounded-[18px] bg-surface px-4 py-3">
              <span className="truncate text-sm text-ink">{label(k)}</span>
              <span className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-xl text-brand-800 tabular-nums">{asked.filter((d) => !d.meta.optional).length}</span>
                <span className="text-xs text-muted">{t('settings.docs.ofAsked', { n: asked.length })}</span>
              </span>
            </div>
          )
        })}
      </div>
      <div className="scrollbar-slim overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="bg-surface text-[13px] text-soft">
              <th scope="col" className="rounded-s-[18px] py-3 ps-4.5 text-start font-normal">
                {t('settings.docs.document')}
              </th>
              {cols.map((k) => (
                <th key={k} scope="col" className="w-26 px-2 text-center font-normal">
                  {label(k)}
                </th>
              ))}
              <th scope="col" className="w-34 ps-3 text-start font-normal">
                {t('settings.docs.mustSend')}
              </th>
              <th scope="col" className="w-24 rounded-e-[18px]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const shared = rows === byIntegration && byType.includes(d)
              return (
                <tr key={d.key} className="border-b border-line-soft last:border-b-0">
                  <th scope="row" className="py-3.5 ps-4.5 pe-3 text-start font-normal">
                    <span className="flex min-w-0 items-center gap-3">
                      <span dir="ltr" className={cx('inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[10px] font-semibold tracking-wide', BADGE[typeOf(d)])}>
                        {t(`settings.docs.badges.${typeOf(d)}`)}
                      </span>
                      <DocName doc={d} />
                    </span>
                  </th>
                  {cols.map((k) => (
                    <td key={k} className="px-2 text-center">
                      <Tick on={ticked(d, k)} onChange={() => onTick(d, k)} label={t('settings.docs.needs', { type: label(k), name: d.label })} />
                    </td>
                  ))}
                  <td className="ps-3">
                    {shared ? (
                      <span className="text-xs text-muted">{t('settings.docs.fromAbove')}</span>
                    ) : (
                      <MustSend
                        optional={!!d.meta.optional}
                        label={`${t('settings.docs.mustSend')} ${d.label}`}
                        onChange={(optional) => save({ ...d, meta: withField(d.meta, 'optional', optional ? true : null) })}
                      />
                    )}
                  </td>
                  <td className="pe-2">
                    <span className="flex justify-end gap-2">
                      <IconButton icon="pencil" label={`${t('settings.docs.edit')} ${d.label}`} onClick={() => setEditing({ ...d, labelAr: d.labelAr ?? '' })} />
                      <IconButton
                        icon="trash"
                        danger
                        label={`${t(shared ? 'settings.docs.removeFromIntegrations' : 'settings.docs.remove')} ${d.label}`}
                        onClick={() => (shared ? offIntegrations(d) : setRemoving(d))}
                      />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <Section
      id="docs"
      icon="file"
      action={{ label: t('settings.docs.add'), onClick: () => setAdding({ label: '', labelAr: '', type: 'pdf', plans: types, integrations: [], optional: false }) }}
    >
      {table(t('settings.docs.byType'), t('settings.docs.byTypeSub'), types, byType, (d, k) => typesOf(d).includes(k), tickType)}
      {byIntegration.length ? (
        table(t('settings.docs.byIntegration'), t('settings.docs.byIntegrationSub'), integrations, byIntegration, (d, k) => !!d.meta.integrations?.includes(k), tickIntegration)
      ) : (
        <p className="rounded-2xl bg-surface p-5 text-center text-sm text-muted">{t('settings.docs.noIntegrations')}</p>
      )}

      <EditPopup doc={editing} setDoc={setEditing} onSave={save} />
      <AddPopup draft={adding} setDraft={setAdding} types={types} integrations={integrations} label={label} save={save} refuse={refuse} />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => save({ ...removing, active: false }, t('settings.docs.removed', { name: removing.label }))}
        title={removing ? t('settings.docs.removeTitle', { name: removing.label }) : ''}
        description={t('settings.docs.removeText')}
        confirmLabel={t('settings.docs.remove')}
      />
    </Section>
  )
}

/** A document's name in the reader's language. */
function DocName({ doc: d }) {
  const { lang } = useLang()
  return <span className="min-w-0 truncate text-ink">{(lang === 'ar' && d.labelAr) || d.label}</span>
}

/** A round tick: a teal circle with ✓ when on, an empty ring when off. The real checkbox lies over it. */
function Tick({ on, onChange, label }) {
  return (
    <span className="relative inline-grid size-7 place-items-center">
      <input type="checkbox" checked={on} onChange={onChange} aria-label={label} className="peer absolute inset-0 cursor-pointer opacity-0" />
      <span
        aria-hidden="true"
        className={cx(
          'grid size-7 place-items-center rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300',
          on ? 'bg-brand-700 text-white' : 'ring-[1.5px] ring-edge ring-inset peer-hover:ring-brand-300',
        )}
      >
        {on && <Icon name="check" className="size-3.5" strokeWidth={2.8} />}
      </span>
    </span>
  )
}

/** "● Required ⇕" or "● Optional ⇕": a small pill over the real dropdown. */
function MustSend({ optional, label, onChange }) {
  const { t } = useLang()
  return (
    <span className={cx('relative inline-flex h-8 items-center gap-1.5 rounded-full ps-3 pe-2.5 text-xs', optional ? 'bg-surface text-muted' : 'bg-brand-50 text-brand-800')}>
      <span aria-hidden="true" className={cx('size-1.5 rounded-full', optional ? 'bg-ghost' : 'bg-brand-700')} />
      {t(optional ? 'settings.docs.optional' : 'settings.docs.required')}
      <Icon name="chevronUpDown" className="size-3" strokeWidth={2.2} />
      <select
        aria-label={label}
        value={optional ? 'optional' : 'required'}
        onChange={(e) => onChange(e.target.value === 'optional')}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        <option value="required">{t('settings.docs.required')}</option>
        <option value="optional">{t('settings.docs.optional')}</option>
      </select>
    </span>
  )
}

function IconButton({ icon, label, danger, onClick }) {
  return (
    <Button
      variant="bare"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx('grid size-9 place-items-center rounded-xl transition', danger ? 'bg-danger-bg/60 text-danger hover:bg-danger-bg' : 'bg-surface text-soft hover:bg-surface-hover')}
    >
      <Icon name={icon} className="size-3.75" strokeWidth={1.9} />
    </Button>
  )
}

/** Edit: the names, short names and file type. Who sends it is ticked in the tables. Saves at once. */
function EditPopup({ doc: d, setDoc, onSave }) {
  const { t } = useLang()
  const close = () => setDoc(null)
  const meta = (patch) => setDoc((x) => ({ ...x, meta: { ...x.meta, ...patch } }))
  return (
    <Modal
      open={!!d}
      onClose={close}
      title={t('settings.docs.editTitle')}
      description={d?.label}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!d?.label.trim()}
            onClick={async () => {
              if (await onSave({ ...d, label: d.label.trim(), labelAr: d.labelAr.trim() })) close()
            }}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      {d && (
        <div className="flex flex-col gap-3">
          <Field label={t('settings.docs.english')}>{(props) => <Input {...props} autoFocus value={d.label} onChange={(e) => setDoc((x) => ({ ...x, label: e.target.value }))} />}</Field>
          <Field label={t('settings.docs.arabic')}>{(props) => <Input {...props} dir="rtl" value={d.labelAr} onChange={(e) => setDoc((x) => ({ ...x, labelAr: e.target.value }))} />}</Field>
          <FileTypes value={typeOf(d)} onChange={(type) => meta({ type })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('settings.docs.short')} hint={t('settings.docs.shortHint')}>
              {(props) => <Input {...props} value={d.meta.short ?? ''} onChange={(e) => meta({ short: e.target.value })} />}
            </Field>
            <Field label={t('settings.docs.shortAr')}>{(props) => <Input {...props} dir="rtl" value={d.meta.short_ar ?? ''} onChange={(e) => meta({ short_ar: e.target.value })} />}</Field>
          </div>
        </div>
      )}
    </Modal>
  )
}

/** Add: its names, file type, who must send it, and whether it's optional. Saves at once. */
function AddPopup({ draft: d, setDraft, types, integrations, label, save, refuse }) {
  const { lists } = useConfig()
  const { t } = useLang()
  const close = () => setDraft(null)
  const set = (patch) => setDraft((x) => ({ ...x, ...patch }))
  const tick = (field, k) => set({ [field]: d[field].includes(k) ? d[field].filter((x) => x !== k) : [...d[field], k] })
  const add = async () => {
    const text = d.label.trim()
    if (!d.plans.length && !d.integrations.length) return refuse(t('settings.docs.pickWho'))
    const all = lists.document ?? []
    const key = slug(text) || `doc_${all.length + 1}`
    const old = all.find((o) => o.key === key)
    const meta = {
      type: d.type,
      ...(same(d.plans, types) ? {} : { plans: d.plans }),
      ...(d.integrations.length ? { integrations: d.integrations } : {}),
      ...(d.optional ? { optional: true } : {}),
    }
    const doc = { key, label: text, labelAr: d.labelAr.trim(), active: true, sort: old?.sort ?? Math.max(0, ...all.map((o) => o.sort ?? 0)) + 1, meta }
    if (await save(doc, t('settings.docs.added', { name: text }))) close()
  }
  return (
    <Modal
      open={!!d}
      onClose={close}
      title={t('settings.docs.add')}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button onClick={add} disabled={!d?.label.trim()}>
            {t('settings.docs.add')}
          </Button>
        </>
      }
    >
      {d && (
        <div className="flex flex-col gap-4">
          <Field label={t('settings.docs.english')}>{(props) => <Input {...props} autoFocus value={d.label} onChange={(e) => set({ label: e.target.value })} />}</Field>
          <Field label={t('settings.docs.arabic')}>{(props) => <Input {...props} dir="rtl" value={d.labelAr} onChange={(e) => set({ labelAr: e.target.value })} />}</Field>
          <FileTypes value={d.type} onChange={(type) => set({ type })} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-soft">{t('settings.docs.whoSends')}</span>
            <span className="flex flex-wrap gap-1.5">
              {types.map((k) => (
                <Option key={k} on={d.plans.includes(k)} onClick={() => tick('plans', k)} className="h-8.5 rounded-full px-3.5 text-[13px]">
                  {label(k)}
                </Option>
              ))}
              {integrations.map((k) => (
                <Option key={k} on={d.integrations.includes(k)} onClick={() => tick('integrations', k)} className="h-8.5 rounded-full px-3.5 text-[13px]">
                  {label(k)}
                </Option>
              ))}
            </span>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" checked={d.optional} onChange={(e) => set({ optional: e.target.checked })} className="size-4.5 accent-brand-700" />
            {t('settings.docs.optionalBox')}
          </label>
        </div>
      )}
    </Modal>
  )
}

/** PDF · Image · Excel · Any, as one row of choices. */
function FileTypes({ value, onChange }) {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] text-soft">{t('settings.docs.fileType')}</span>
      <span role="radiogroup" aria-label={t('settings.docs.fileType')} className="flex flex-wrap gap-1.5">
        {Object.keys(FILE_TYPES).map((k) => (
          <Option key={k} role="radio" aria-checked={value === k} on={value === k} onClick={() => onChange(k)} className="h-8.5 rounded-full px-3.5 text-[13px]">
            {t(`settings.docs.types.${k}`)}
          </Option>
        ))}
      </span>
    </div>
  )
}
