import { useState } from 'react'
import { Button, Card, cx, Icon, ReasonDialog, TONES } from '@/components'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { dayKey, formatShort, fromDay, riyadhNow } from '../../models/rules/format.js'

/*
 * The 6 checks in the order Sales works through them, with where each is fixed: a section of this
 * tab, or the Setup tab (the Account Member makes the account). Their words are sales.member.ready.checks
 * and sales.member.ready.hints. The pass/fail answer is the server's.
 */
const CHECKS = [
  ['details', 'account-details'],
  ['requirements', 'requirements'],
  ['documents', 'requirements'],
  ['account', 'setup'],
  ['hardware', 'requirements'],
  ['session', 'pick-time'],
]

/**
 * The top of the Sales tab while Sales has the member: the ready checks (each opens where it is
 * fixed), the Transfer deadline, Transfer (on only when every check passes) and Mark Lost.
 */
export function ReadyCheckCard({ member: m, can, act, onTab }) {
  const { active, label } = useConfig()
  const { t } = useLang()
  const [losing, setLosing] = useState(false)
  const ready = m.ready ?? {}
  const done = CHECKS.filter(([k]) => ready[k]).length
  const late = m.transferDeadline && m.transferDeadline <= dayKey(riyadhNow())
  const deadline = !m.transferDeadline
    ? t('sales.member.ready.noDeadline')
    : t(late ? 'sales.member.ready.deadlinePassed' : 'sales.member.ready.transferBefore', { date: formatShort(fromDay(m.transferDeadline)) })
  const go = (to) => (to === 'setup' ? onTab('setup') : document.getElementById(to)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))

  return (
    <Card as="section" id="ready" padding="none" className="flex min-w-0 animate-rise scroll-mt-6 flex-col gap-4 px-6 py-5">
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={cx(
            'grid size-12 shrink-0 place-items-center rounded-[16px] text-[15px] tabular-nums',
            ready.ok ? 'bg-success text-white' : cx(TONES.warn.fill, TONES.warn.text),
          )}
        >
          {ready.ok ? <Icon name="check" className="size-5" strokeWidth={2.4} /> : `${done}/${CHECKS.length}`}
        </span>
        <span className="flex min-w-48 flex-1 flex-col gap-0.5">
          <h2 className="text-h2 text-ink">{t(ready.ok ? 'sales.member.ready.ready' : 'sales.member.ready.notReady')}</h2>
          <span className={cx('text-[13px]', late ? TONES.danger.text : 'text-muted')}>
            {t('sales.member.ready.summary', { done, total: CHECKS.length, deadline })}
          </span>
        </span>
        {(can.has('mark_lost') || can.has('transfer')) && (
          <div className="flex flex-wrap gap-2">
            {can.has('mark_lost') && (
              <Button id="ready-check-card-mark-lost" variant="outline" onClick={() => setLosing(true)}>
                {t('sales.member.ready.markLost')}
              </Button>
            )}
            {can.has('transfer') && (
              <Button id="ready-check-card-transfer-off" onClick={act.transfer} disabled={!ready.ok || act.busy} title={ready.ok ? undefined : t('sales.member.ready.transferOff')}>
                {t('sales.member.ready.transfer')}
                <Icon name="chevronRight" className="size-4" strokeWidth={2} />
              </Button>
            )}
          </div>
        )}
      </div>
      <ul className="flex flex-wrap gap-2">
        {CHECKS.map(([k, to]) => (
          <li key={k}>
            <Button id={`ready-check-card-hints-${k}`}
              variant="bare"
              title={t(`sales.member.ready.hints.${k}`)}
              onClick={() => go(to)}
              className={cx(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] whitespace-nowrap transition hover:opacity-80',
                ready[k] ? cx(TONES.success.fill, TONES.success.text) : cx(TONES.warn.fill, TONES.warn.text),
              )}
            >
              <Icon name={ready[k] ? 'check' : 'close'} className="size-3.5" strokeWidth={2.6} />
              {t(`sales.member.ready.checks.${k}`)}
            </Button>
          </li>
        ))}
      </ul>
      <ReasonDialog id="ready-check-card-why"
        open={losing}
        onClose={() => setLosing(false)}
        title={t('sales.member.ready.lostTitle')}
        description={t('sales.member.ready.lostDescription')}
        label={t('sales.member.ready.why')}
        choices={active('lost_reason').map((o) => ({ ...o, label: label('lost_reason', o.key) }))}
        confirmLabel={t('sales.member.ready.markLost')}
        tone="danger"
        onConfirm={({ choice, text }) => act.lost(choice, text)}
      />
    </Card>
  )
}
