import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { Badge, Button, ReasonDialog, cx } from '../../components/ui/index.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { formatShort, fromDay } from '../../models/rules/format.js'
import { Panel, PanelActions } from '../shared/member/Panel.jsx'

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
    <Panel
      title={t('member.setup.title')}
      sub={
        m.setupDoneAt ? t('member.setup.done')
        : m.setupDue ? t('member.setup.finishBy', { date: formatShort(fromDay(m.setupDue)), n: settings.setupDueDays })
        : t('member.setup.beforeSession')
      }
      aside={<Badge tone={done === items.length ? 'success' : 'warn'}>{t('member.setup.count', { done, total: items.length })}</Badge>}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
        {items.map((o) => {
          const on = !!m.setupChecks?.[o.key]
          return (
            <Button
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
              <span className={cx('grid size-6 shrink-0 place-items-center rounded-lg text-white', on ? 'bg-brand-700' : 'bg-panel ring-[1.5px] ring-[#c9ced8] ring-inset')}>
                {on && <Icon name="check" className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="flex-1">{label('setup_check', o.key)}</span>
            </Button>
          )
        })}
      </div>
      {can.has('send_back') && (
        <PanelActions>
          <Button variant="soft" size="sm" onClick={() => setBacking(true)}>
            {t('member.sendBack.to', { step: to })}
          </Button>
        </PanelActions>
      )}
      <ReasonDialog
        open={backing}
        onClose={() => setBacking(false)}
        title={t('member.sendBack.to', { step: to })}
        description={t('member.sendBack.description')}
        label={t('member.sendBack.missing')}
        confirmLabel={t('member.sendBack.confirm')}
        onConfirm={({ text }) => act.sendBack(text)}
      />
    </Panel>
  )
}
