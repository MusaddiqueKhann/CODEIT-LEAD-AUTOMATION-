import { useState } from 'react'
import { Badge, Button, cx, Panel, PanelActions, ReasonDialog, Tick } from '@/components'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { formatShort, fromDay } from '../../models/rules/format.js'

/** The setup checklist (Settings → Lists) as tick tiles. All ticked moves it to Session. */
export function SetupCard({ member: m, can, act }) {
  const { lists, settings, label } = useConfig()
  const { t } = useLang()
  const [backing, setBacking] = useState(false)
  const edit = can.has('setup')
  const items = (lists.setup_check ?? []).filter((o) => o.active || m.setupChecks?.[o.key] !== undefined)
  const done = items.filter((o) => m.setupChecks?.[o.key]).length
  const to = label('step', m.integrations.length ? 'integration' : 'sales')

  return (
    <Panel id="setup-card-title"
      title={t('onboarding.member.setup.title')}
      sub={
        m.setupDoneAt ? t('onboarding.member.setup.done')
        : m.setupDue ? t('onboarding.member.setup.finishBy', { date: formatShort(fromDay(m.setupDue)), n: settings.setupDueDays })
        : t('onboarding.member.setup.beforeSession')
      }
      aside={<Badge tone={done === items.length ? 'success' : 'warn'}>{t('onboarding.member.setup.count', { done, total: items.length })}</Badge>}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
        {items.map((o) => {
          const on = !!m.setupChecks?.[o.key]
          return (
            <Button id={`setup-card-to-${o.key}`}
              key={o.key}
              variant="bare"
              role="checkbox"
              aria-checked={on}
              disabled={!edit || act.busy}
              onClick={() => act.setupCheck(o.key, !on)}
              className={cx(
                'flex min-h-12 items-center gap-3 rounded-2xl ps-3 pe-4 text-start text-sm transition-colors disabled:cursor-default',
                on ? 'bg-tint text-brand-800' : 'bg-surface text-ink enabled:hover:bg-surface-hover',
              )}
            >
              <Tick on={on} size={6} shape="square" />
              <span className="flex-1">{label('setup_check', o.key)}</span>
            </Button>
          )
        })}
      </div>
      {can.has('send_back') && (
        <PanelActions>
          <Button id="setup-card-to-2" variant="soft" size="sm" onClick={() => setBacking(true)}>
            {t('shared.member.sendBack.to', { step: to })}
          </Button>
        </PanelActions>
      )}
      <ReasonDialog id="setup-card-missing"
        open={backing}
        onClose={() => setBacking(false)}
        title={t('shared.member.sendBack.to', { step: to })}
        description={t('shared.member.sendBack.description')}
        label={t('shared.member.sendBack.missing')}
        confirmLabel={t('shared.member.sendBack.confirm')}
        onConfirm={({ text }) => act.sendBack(text)}
      />
    </Panel>
  )
}
