import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { DocumentsPanel } from '../../components/shared/index.js'
import { Badge, Button, ReasonDialog, cx } from '../../components/ui/index.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { formatShort, fromDay } from '../../models/rules/format.js'
import { docsFor, integrationDocs } from '../../models/rules/members.js'
import { Panel, PanelActions } from '../shared/member/Panel.jsx'
import { Toggle } from '../shared/member/Toggle.jsx'

/**
 * Each integration: Connected, Tested, Waiting on provider, notes, and the documents it needs (its
 * own and the ones it also uses, like the CR), to read and open. Then Hand to Onboarding or Send back.
 */
export function IntegrationCard({ member: m, can, act }) {
  const { label, active } = useConfig()
  const { t } = useLang()
  const [backing, setBacking] = useState(false)
  const edit = can.has('integration')
  const checks = m.integrationChecks ?? {}
  const finished = m.integrations.every((k) => checks[k]?.connected && checks[k]?.tested)

  const ready = m.integrations.filter((k) => checks[k]?.connected && checks[k]?.tested).length
  const documents = active('document')
  const memberDocs = docsFor(documents, m.plan, m.integrations)

  return (
    <Panel
      title={t('member.integration.title')}
      sub={
        m.integrationDoneAt ? t('member.integration.allDone')
        : m.integrationDue ? t('member.integration.finishBy', { date: formatShort(fromDay(m.integrationDue)) })
        : t('member.integration.before')
      }
      aside={<Badge tone={ready === m.integrations.length ? 'success' : 'warn'}>{t('member.integration.count', { ready, total: m.integrations.length })}</Badge>}
    >
      <ul className="-my-2 flex flex-col">
        {m.integrations.map((k) => {
          const c = checks[k] ?? {}
          const ok = c.connected && c.tested
          const status = t(ok ? 'member.integration.ok' : c.waiting ? 'member.integration.waiting' : c.connected ? 'member.integration.needsTest' : 'member.integration.notConnected')
          return (
            <li key={k} className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span
                    className={cx(
                      'grid size-10 shrink-0 place-items-center rounded-[13px] transition-colors',
                      ok ? 'bg-success-bg text-success-ink' : c.waiting ? 'bg-warn-bg text-warn-ink' : 'bg-tint text-brand-700',
                    )}
                  >
                    <Icon name="link" className="size-4.5" strokeWidth={1.8} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] font-medium tracking-[-0.01em] text-ink">{label('integration', k)}</span>
                    <span className={cx('text-xs', ok ? 'text-success-ink' : c.waiting ? 'text-warn-ink' : 'text-muted')}>{status}</span>
                  </span>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Toggle on={!!c.connected} label={t('member.integration.connected')} disabled={!edit || act.busy} onChange={(v) => act.integrationCheck(k, { connected: v })} />
                  <Toggle on={!!c.tested} label={t('member.integration.tested')} disabled={!edit || act.busy} onChange={(v) => act.integrationCheck(k, { tested: v })} />
                  <Toggle warn on={!!c.waiting} label={t('member.integration.waiting')} disabled={!edit || act.busy} onChange={(v) => act.integrationCheck(k, { waiting: v })} />
                </div>
              </div>
              {edit ? (
                <input
                  defaultValue={c.notes ?? ''}
                  placeholder={t('member.integration.notes')}
                  onBlur={(e) => e.target.value !== (c.notes ?? '') && act.integrationCheck(k, { notes: e.target.value })}
                  className="h-10 rounded-xl bg-field px-3.5 text-[13px] text-ink outline-none placeholder:text-ghost focus:bg-panel focus:ring-[1.5px] focus:ring-brand-700 focus:ring-inset"
                />
              ) : (
                c.notes && <p className="text-[13px] text-muted">{c.notes}</p>
              )}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs tracking-[0.12em] text-muted uppercase">{t('member.integration.documents', { name: label('integration', k) })}</span>
                <DocumentsPanel
                  readOnly
                  keys={integrationDocs(documents, k, memberDocs)}
                  files={m.files}
                  due={m.due}
                  openFile={act.openFile}
                  empty={t('member.integration.noDocuments', { name: label('integration', k) })}
                />
              </div>
            </li>
          )
        })}
      </ul>
      {edit && (
        <PanelActions>
          <Button onClick={act.handOver} disabled={!finished || act.busy}>
            {t('member.integration.handTo', { step: label('step', 'onboarding') })}
          </Button>
          {!finished && <span className="text-xs text-muted">{t('member.integration.handOff')}</span>}
          {can.has('send_back') && (
            <Button variant="soft" className="ms-auto" onClick={() => setBacking(true)}>
              {t('member.sendBack.to', { step: label('step', 'sales') })}
            </Button>
          )}
        </PanelActions>
      )}
      <ReasonDialog
        open={backing}
        onClose={() => setBacking(false)}
        title={t('member.sendBack.to', { step: label('step', 'sales') })}
        description={t('member.sendBack.descriptionTo', { step: label('step', 'sales') })}
        label={t('member.sendBack.missing')}
        confirmLabel={t('member.sendBack.confirm')}
        onConfirm={({ text }) => act.sendBack(text)}
      />
    </Panel>
  )
}
