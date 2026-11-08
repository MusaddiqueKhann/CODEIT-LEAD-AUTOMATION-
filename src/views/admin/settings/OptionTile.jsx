import { useState } from 'react'
import { Button, cx, Field, Icon, IconButton, Input, Modal, Option } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'

/**
 * One option of a list as a tile (Lists Page Variations 12c): its name and the other language's
 * name, its place in the list (#1, #2… — also the handle that moves it: drag it, or use the arrow
 * keys on it), then under a dashed line what its list adds (a customer type's website, a
 * feature's customer types, a deadline's days, a role's portal name) and Edit. Turning it off and
 * how many members have it are in the Edit popup; a turned-off tile fades and says Hidden.
 */
export function OptionTile({ list, option: o, index, fixed, used, one, dragging, onDragStart, onDragEnd, onDropOn, onMove, onToggle, onSave }) {
  const { label } = useConfig()
  const { t, lang } = useLang()
  const [over, setOver] = useState(false)
  const [draft, setDraft] = useState(null) // the option being edited, while the popup is open
  const name = (lang === 'ar' && o.labelAr) || o.label
  const other = lang === 'ar' ? (o.labelAr ? o.label : '') : o.labelAr
  const extra = extraOf(list, o.meta, t, lang, label)
  const site = list === 'business_type' && o.meta.site

  return (
    <div
      title={used == null ? undefined : used ? t('admin.settings.lists.used', { n: used }) : t('admin.settings.lists.notUsed')}
      onDragOver={(e) => {
        if (fixed) return
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={() => {
        setOver(false)
        onDropOn()
      }}
      className={cx(
        'flex min-w-0 flex-col rounded-[24px] bg-panel shadow-[0_10px_28px_-20px_rgb(30_50_80/0.35)] ring-1 ring-line transition ring-inset',
        over && 'ring-[1.5px] ring-brand-700',
        dragging && 'opacity-40',
      )}
    >
      <div className={cx('flex flex-1 items-start gap-3 px-5 pt-4.5 pb-4', !o.active && 'opacity-55')}>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-[17px] leading-snug font-medium text-ink">{name}</span>
          {other ? (
            // The line follows the page's side; only the name itself reads in its own direction.
            <span className="text-[15px] text-soft">
              <bdi dir={lang === 'ar' ? 'ltr' : 'rtl'}>{other}</bdi>
            </span>
          ) : (
            <span title={t('admin.settings.lists.noArabicHint')} className="text-[13px] text-ghost">
              {t('admin.settings.lists.noArabic')}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {!o.active && <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">{t('admin.settings.lists.hiddenTag')}</span>}
          {fixed ? (
            <span className="text-xs text-faint tabular-nums">#{index + 1}</span>
          ) : (
            <Button variant="bare" id={`option-tile-${list}-${o.key}-move`}
              type="button"
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  onMove(e.key === 'ArrowUp' ? -1 : 1)
                }
              }}
              aria-label={t('admin.settings.lists.move', { name })}
              title={t('admin.settings.lists.move', { name })}
              className="cursor-grab rounded-md px-1 text-xs text-faint tabular-nums transition hover:bg-surface hover:text-soft active:cursor-grabbing"
            >
              #{index + 1}
            </Button>
          )}
        </span>
      </div>
      <div className="flex min-h-15 items-center gap-3 border-t border-dashed border-line px-5 py-2.5">
        <span className={cx('flex min-w-0 flex-1 items-center gap-2 text-[13px]', !o.active && 'opacity-55')}>
          {extra && <Icon name={EXTRA_ICON[list]} className="size-3.5 shrink-0 text-brand-700" strokeWidth={1.8} />}
          {site ? (
            <a id={`option-tile-${list}-${o.key}-site`} href={/^https?:\/\//.test(site) ? site : `https://${site}`} target="_blank" rel="noreferrer" title={t('admin.settings.lists.openSite')} dir="ltr" className="v-option-tile__link truncate font-mono text-brand-800 hover:underline">
              {extra}
            </a>
          ) : (
            extra && <span className="truncate text-soft">{extra}</span>
          )}
        </span>
        <IconButton id={`option-tile-${list}-${o.key}-edit`} icon="pencil" label={`${t('shared.common.edit')} ${name}`} title={t('shared.common.edit')} shape="square" onClick={() => setDraft({ ...o, labelAr: o.labelAr ?? '', meta: o.meta ?? {} })} />
      </div>

      <EditPopup list={list} draft={draft} setDraft={setDraft} fixed={fixed} used={used} one={one} onSave={onSave} onToggle={onToggle} />
    </div>
  )
}

/* The icon beside each list's extra. */
const EXTRA_ICON = { business_type: 'globe', feature: 'list', due_choice: 'clock', role: 'shield' }

/** The Edit popup: the names and what this list adds. Save saves at once; Turn off / on does too. */
function EditPopup({ list, draft: d, setDraft, fixed, used, one, onSave, onToggle }) {
  const { brand } = useConfig()
  const { t } = useLang()
  const meta = (patch) => setDraft((x) => ({ ...x, meta: { ...x.meta, ...patch } }))
  const text = (field) => ({ value: d?.meta[field] ?? '', onChange: (e) => meta({ [field]: e.target.value }) })
  const close = () => setDraft(null)

  return (
    <Modal id="option-tile-edit-2"
      open={!!d}
      onClose={close}
      title={t('admin.settings.lists.edit', { name: one })}
      description={d?.label}
      footer={
        <>
          {!fixed && (
            <Button id="option-tile-cancel"
              variant={d?.active ? 'danger' : 'soft'}
              className="me-auto"
              onClick={async () => {
                if (await onToggle(!d.active)) close()
              }}
            >
              {t(d?.active ? 'admin.settings.lists.turnOff' : 'admin.settings.lists.turnOn')}
            </Button>
          )}
          <Button id="option-tile-cancel-2" variant="outline" onClick={close}>
            {t('shared.common.cancel')}
          </Button>
          <Button id="option-tile-save"
            onClick={async () => {
              if (await onSave({ ...d, label: d.label.trim(), labelAr: d.labelAr.trim(), meta: tidy(d.meta) })) close()
            }}
          >
            {t('shared.common.save')}
          </Button>
        </>
      }
    >
      {d && (
        <div className="flex flex-col gap-3">
          <Field id="option-tile-name" label={t('admin.settings.lists.name')}>{(props) => <Input {...props} autoFocus value={d.label} onChange={(e) => setDraft((x) => ({ ...x, label: e.target.value }))} />}</Field>
          <Field id="option-tile-name-ar" label={t('admin.settings.lists.nameAr')}>
            {(props) => <Input {...props} dir="rtl" value={d.labelAr} onChange={(e) => setDraft((x) => ({ ...x, labelAr: e.target.value }))} />}
          </Field>
          {list === 'business_type' && (
            <Field id="option-tile-site" label={t('admin.settings.lists.site', { product: brand.product })} hint={t('admin.settings.lists.siteHint', { name: d.label })}>
              {(props) => <Input {...props} dir="ltr" placeholder={t('admin.settings.lists.sitePlaceholder')} {...text('site')} />}
            </Field>
          )}
          {list === 'feature' && <TypeChips plans={d.meta.plans ?? []} onChange={(plans) => meta({ plans })} />}
          {list === 'due_choice' && (
            <Field id="option-tile-days" label={t('admin.settings.lists.days')}>
              {(props) => <Input {...props} type="number" min={1} value={d.meta.days ?? ''} onChange={(e) => meta({ days: Number(e.target.value) || undefined })} />}
            </Field>
          )}
          {list === 'role' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="option-tile-portal-name" label={t('admin.settings.lists.portalName')}>{(props) => <Input {...props} placeholder={t('admin.settings.lists.portalPlaceholder')} {...text('portal')} />}</Field>
              <Field id="option-tile-arabic-portal" label={t('admin.settings.lists.arabicPortal')}>{(props) => <Input {...props} dir="rtl" {...text('portal_ar')} />}</Field>
              <Field id="option-tile-team-name" label={t('admin.settings.lists.teamName')}>{(props) => <Input {...props} placeholder={t('admin.settings.lists.teamPlaceholder')} {...text('team')} />}</Field>
              <Field id="option-tile-arabic-team" label={t('admin.settings.lists.arabicTeam')}>{(props) => <Input {...props} dir="rtl" {...text('team_ar')} />}</Field>
            </div>
          )}
          {used != null && <p className="text-xs text-muted">{used ? t('admin.settings.lists.used', { n: used }) : t('admin.settings.lists.notUsed')}</p>}
          {!fixed && <p className="text-xs text-muted">{t('admin.settings.lists.hiddenNote')}</p>}
        </div>
      )}
    </Modal>
  )
}

/** Which customer types a feature is for; none ticked means all of them. */
function TypeChips({ plans, onChange }) {
  const { lists, label } = useConfig()
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] text-soft">{t('admin.settings.lists.forTypes')}</span>
      <span className="flex flex-wrap gap-1.5">
        {(lists.business_type ?? []).map((b) => (
          <Option id={`option-tile-in-days-${b.key}`} key={b.key} on={plans.includes(b.key)} onClick={() => onChange(plans.includes(b.key) ? plans.filter((p) => p !== b.key) : [...plans, b.key])} className="h-8 rounded-full px-3 text-xs">
            {label('business_type', b.key)}
          </Option>
        ))}
      </span>
    </div>
  )
}

/** What a row shows for its list, or nothing. */
function extraOf(list, meta, t, lang, label) {
  if (list === 'business_type') return meta.site?.replace(/^https?:\/\//, '')
  if (list === 'due_choice' && meta.days) return t('admin.settings.lists.inDays', { n: meta.days })
  if (list === 'role') return (lang === 'ar' && meta.portal_ar) || meta.portal
  if (list === 'feature' && meta.plans?.length) return meta.plans.map((p) => label('business_type', p)).join(lang === 'ar' ? '، ' : ', ')
  return null
}

/** Drops empty extras, so "no types" means every customer type. */
const tidy = (meta) =>
  Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)))
