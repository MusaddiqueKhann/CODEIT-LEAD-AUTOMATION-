import { useState } from 'react'
import { Badge, Button, cx, DocumentsPanel, Icon, Input, Panel, PanelActions, ReasonDialog, TickPill } from '@/components'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { formatShort, fromDay } from '../../models/rules/format.js'
import { docsFor, integrationDocs } from '../../models/rules/members.js'

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
    <Panel id="integration-card-title"
      title={t('integration.member.title')}
      sub={
        m.integrationDoneAt ? t('integration.member.allDone')
        : m.integrationDue ? t('integration.member.finishBy', { date: formatShort(fromDay(m.integrationDue)) })
        : t('integration.member.before')
      }
      aside={<Badge tone={ready === m.integrations.length ? 'success' : 'warn'}>{t('integration.member.count', { ready, total: m.integrations.length })}</Badge>}
    >
      <ul className="-my-2 flex flex-col">
        {m.integrations.map((k) => {
          const c = checks[k] ?? {}
          const ok = c.connected && c.tested
          const status = t(ok ? 'integration.member.ok' : c.waiting ? 'integration.member.waiting' : c.connected ? 'integration.member.needsTest' : 'integration.member.notConnected')
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
                  <TickPill id={`integration-card-connected-${k}`} on={!!c.connected} label={t('integration.member.connected')} disabled={!edit || act.busy} onChange={(v) => act.integrationCheck(k, { connected: v })} />
                  <TickPill id={`integration-card-tested-${k}`} on={!!c.tested} label={t('integration.member.tested')} disabled={!edit || act.busy} onChange={(v) => act.integrationCheck(k, { tested: v })} />
                  <TickPill id={`integration-card-waiting-${k}`} warn on={!!c.waiting} label={t('integration.member.waiting')} disabled={!edit || act.busy} onChange={(v) => act.integrationCheck(k, { waiting: v })} />
                </div>
              </div>
              {edit ? (
                <Input bare id={`integration-card-notes-${k}`}
                  defaultValue={c.notes ?? ''}
                  placeholder={t('integration.member.notes')}
                  onBlur={(e) => e.target.value !== (c.notes ?? '') && act.integrationCheck(k, { notes: e.target.value })}
                  className="h-10 rounded-xl bg-field px-3.5 text-[13px] text-ink outline-none placeholder:text-ghost focus:bg-panel focus:ring-[1.5px] focus:ring-brand-700 focus:ring-inset"
                />
              ) : (
                c.notes && <p className="text-[13px] text-muted">{c.notes}</p>
              )}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs tracking-[0.12em] text-muted uppercase">{t('integration.member.documents', { name: label('integration', k) })}</span>
                <DocumentsPanel id={`integration-card-documents-${k}`}
                  readOnly
                  keys={integrationDocs(documents, k, memberDocs)}
                  files={m.files}
                  due={m.due}
                  openFile={act.openFile}
                  empty={t('integration.member.noDocuments', { name: label('integration', k) })}
                />
              </div>
            </li>
          )
        })}
      </ul>
      {edit && (
        <PanelActions>
          <Button id="integration-card-hand-to" onClick={act.handOver} disabled={!finished || act.busy}>
            {t('integration.member.handTo', { step: label('step', 'onboarding') })}
          </Button>
          {!finished && <span className="text-xs text-muted">{t('integration.member.handOff')}</span>}
          {can.has('send_back') && (
            <Button id="integration-card-to" variant="soft" className="ms-auto" onClick={() => setBacking(true)}>
              {t('shared.member.sendBack.to', { step: label('step', 'sales') })}
            </Button>
          )}
        </PanelActions>
      )}
      <ReasonDialog id="integration-card-missing"
        open={backing}
        onClose={() => setBacking(false)}
        title={t('shared.member.sendBack.to', { step: label('step', 'sales') })}
        description={t('shared.member.sendBack.descriptionTo', { step: label('step', 'sales') })}
        label={t('shared.member.sendBack.missing')}
        confirmLabel={t('shared.member.sendBack.confirm')}
        onConfirm={({ text }) => act.sendBack(text)}
      />
    </Panel>
  )
}
