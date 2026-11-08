import { useState } from 'react'
import { Button, cx, Field, Icon, Input, Modal } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useToast } from '../../../controllers/shared/ToastContext.jsx'
import { saveOption } from '../../../controllers/admin/settings.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { useMembers } from '../../../controllers/shared/useMembers.js'
import { atStep, statusOf } from '../../../models/rules/stages.js'
import { OptionTile } from './OptionTile.jsx'
import { useShownNow } from './useShownNow.js'

/** Roles and steps are what the rules are built on: their names change, nothing else. */
const FIXED = ['role', 'step']
/* Whether a member has an option, for the lists a member's own fields hold; the others show no count. */
const HAS = {
  business_type: (m, k) => m.plan === k,
  feature: (m, k) => m.features?.[k] === true,
  integration: (m, k) => m.integrations?.includes(k),
  industry: (m, k) => m.industry === k,
  size: (m, k) => m.size === k,
  hardware_step: (m, k) => m.hardware?.step === k,
  step: (m, k) => (k === 'setup' ? atStep(m, k) : statusOf(m) === k),
}
const slug = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

/**
 * One list on the right of Lists: its name and what it's for, Add, and its options as numbered tiles
 * (12c). Every change saves at once; the toast offers Undo (back to what it was). Tiles reorder by
 * dragging their number or with the arrow keys on it.
 */
export function ListPanel({ list, after, fill }) {
  const { lists } = useConfig()
  const { t } = useLang()
  const { toast } = useToast()
  const { run, busy } = useAction(after)
  const { data: members } = useMembers()
  const [adding, setAdding] = useState(null) // { label, labelAr } while the Add popup is open
  const [dragging, setDragging] = useState(null)
  const { shown: items, show, drop } = useShownNow(lists[list] ?? [])
  const fixed = FIXED.includes(list)
  const one = t(`admin.settings.lists.one.${list}`)
  const used = (key) => (members && HAS[list] ? members.filter((m) => HAS[list](m, key)).length : null)
  const undo = (restore) => ({ label: t('shared.common.undo'), onClick: () => run(restore) })

  /** Saves one option; the toast says `message` and Undo puts back what it was. Resolves whether it saved. */
  const save = async (next, message) => {
    const before = items.find((o) => o.key === next.key)
    const refuse = (words) => {
      toast(words, 'danger')
      return false
    }
    if (!next.label.trim()) return refuse(t('admin.settings.lists.needsName'))
    if (before.active && !next.active && items.filter((o) => o.active).length === 1) return refuse(t('admin.settings.lists.keepOne', { name: one }))
    show(next)
    const done = await run(() => saveOption(list, next))
    if (done) toast(message, 'success', undo(() => saveOption(list, before)))
    else drop(next.key)
    return done
  }
  const toggle = (o, active) => {
    const n = used(o.key)
    const message = active ? t('admin.settings.lists.shown', { name: o.label }) : n ? t('admin.settings.lists.hidden', { name: o.label, n }) : t('admin.settings.lists.hiddenUnused', { name: o.label })
    return save({ ...o, active }, message)
  }
  /** Puts `key` where `target` is, and saves every option whose place changed. */
  const reorder = async (key, target) => {
    if (key === target) return
    const keys = items.map((o) => o.key)
    const to = keys.indexOf(target)
    keys.splice(keys.indexOf(key), 1)
    keys.splice(to, 0, key)
    const moved = keys.map((k, i) => ({ ...items.find((o) => o.key === k), sort: i + 1 })).filter((o) => o.sort !== items.find((x) => x.key === o.key).sort)
    const before = moved.map((o) => items.find((x) => x.key === o.key))
    const saveAll = async (rows) => {
      for (const o of rows) await saveOption(list, o)
    }
    moved.forEach(show)
    if (await run(() => saveAll(moved))) toast(t('admin.settings.lists.ordered'), 'success', undo(() => saveAll(before)))
    else moved.forEach((o) => drop(o.key))
  }
  const add = async () => {
    const label = adding.label.trim()
    const key = slug(label) || `option_${items.length + 1}`
    if (items.some((o) => o.key === key)) return toast(t('admin.settings.lists.duplicate'), 'danger')
    const option = { key, label, labelAr: adding.labelAr.trim(), active: true, sort: Math.max(0, ...items.map((o) => o.sort ?? 0)) + 1, meta: {} }
    if (await run(() => saveOption(list, option), t('admin.settings.lists.added', { name: label }))) setAdding(null)
  }

  return (
    <div className={cx('flex min-w-0 flex-col gap-4', fill && 'lg:min-h-0')}>
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-h2 text-ink">{t(`admin.settings.lists.names.${list}`)}</h3>
          <span className="text-sm text-muted">{t(`admin.settings.lists.about.${list}`)}</span>
        </span>
        {!fixed && (
          <Button id="list-panel-add"
            onClick={() => setAdding({ label: '', labelAr: '' })}
            aria-label={t('admin.settings.lists.add', { name: one })}
            className="shrink-0 gap-2 shadow-[0_8px_18px_-10px_rgb(54_123_127/0.7)]"
          >
            <Icon name="plus" className="size-4" strokeWidth={2.2} />
            {t('shared.common.add')}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl bg-surface p-6 text-center text-sm text-muted">{t('admin.settings.lists.empty', { name: one })}</p>
      ) : (
        // The tiles scroll under the list's name and Add (on a fixed-height page); the padding keeps their shadows.
        <div className={cx('grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] content-start gap-4', fill && 'scrollbar-slim lg:-m-1.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:p-1.5')}>
          {items.map((o, i) => (
            <OptionTile
              key={`${o.key}:${o.label}:${o.labelAr}:${o.active}:${JSON.stringify(o.meta)}`}
              list={list}
              option={o}
              index={i}
              fixed={fixed}
              used={used(o.key)}
              one={one}
              dragging={dragging === o.key}
              onDragStart={() => setDragging(o.key)}
              onDragEnd={() => setDragging(null)}
              onDropOn={() => dragging && reorder(dragging, o.key)}
              onMove={(dir) => items[i + dir] && reorder(o.key, items[i + dir].key)}
              onToggle={(active) => toggle(o, active)}
              onSave={(next) => save(next, t('admin.settings.lists.saved', { name: next.label }))}
            />
          ))}
        </div>
      )}
      {fixed && <p className="text-xs text-muted">{t('admin.settings.lists.rareNote')}</p>}

      <Modal id="list-panel-add-2"
        open={!!adding}
        onClose={() => setAdding(null)}
        title={t('admin.settings.lists.add', { name: one })}
        description={t(`admin.settings.lists.names.${list}`)}
        footer={
          <>
            <Button id="list-panel-cancel" variant="outline" onClick={() => setAdding(null)}>
              {t('shared.common.cancel')}
            </Button>
            <Button id="list-panel-add-3" onClick={add} disabled={!adding?.label.trim() || busy}>
              {t('shared.common.add')}
            </Button>
          </>
        }
      >
        {adding && (
          <form id="list-panel-name"
            onSubmit={(e) => {
              e.preventDefault()
              if (adding.label.trim()) add()
            }}
            className="v-list-panel__name flex flex-col gap-3"
          >
            <Field id="list-panel-name-2" label={t('admin.settings.lists.name')}>
              {(props) => <Input {...props} autoFocus value={adding.label} onChange={(e) => setAdding((a) => ({ ...a, label: e.target.value }))} />}
            </Field>
            <Field id="list-panel-name-ar" label={t('admin.settings.lists.nameAr')}>
              {(props) => <Input {...props} dir="rtl" value={adding.labelAr} onChange={(e) => setAdding((a) => ({ ...a, labelAr: e.target.value }))} />}
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
