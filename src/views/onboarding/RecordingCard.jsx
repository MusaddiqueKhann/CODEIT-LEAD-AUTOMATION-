import { useState } from 'react'
import { Badge, Button, cx, Icon, Input, Panel, PanelActions, ReasonDialog } from '@/components'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { formatStamp, fromServer, riyadhNow } from '../../models/rules/format.js'

const when = (iso) => formatStamp(fromServer(iso))

/** After the session: the recording link goes to the customer with the feedback form; the link then closes. */
export function RecordingCard({ member: m, can, act }) {
  const { settings, label } = useConfig()
  const { t } = useLang()
  const [link, setLink] = useState('')
  const [bad, setBad] = useState(false)
  const [without, setWithout] = useState(false)
  const hoursLeft = m.linkExpiresAt ? Math.max(0, Math.ceil((fromServer(m.linkExpiresAt) - riyadhNow()) / 36e5)) : null
  const sent = !!m.recordingSentAt

  const send = () => {
    if (!/^https?:\/\/\S+\.\S+/.test(link.trim())) return setBad(true)
    act.sendRecording(link.trim(), null)
  }

  return (
    <Panel id="recording-card-title"
      title={t('onboarding.member.recording.title')}
      sub={m.completedAt ? t('onboarding.member.recording.completed', { at: when(m.completedAt) }) : t('onboarding.member.recording.after')}
      aside={<Badge tone={sent ? 'success' : 'warn'}>{t(sent ? 'onboarding.member.recording.sent' : 'onboarding.member.recording.waiting')}</Badge>}
    >
      {sent ? (
        <div className="flex flex-col gap-3">
          <div className="flex animate-drop items-center gap-3.5 rounded-[18px] bg-success-note p-3 ps-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-panel text-success-ink">
              <Icon name="video" className="size-4.5" strokeWidth={1.8} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-ink">{t(m.recordingLink ? 'onboarding.member.recording.sessionRecording' : 'onboarding.member.recording.withoutRecording')}</span>
              <span className="truncate text-xs text-success-note-ink">
                {m.recordingLink ? <bdi dir="ltr">{m.recordingLink}</bdi> : t('onboarding.member.recording.formOnly')}
              </span>
            </span>
            {m.recordingLink && (
              <a id="recording-card-open" href={m.recordingLink} target="_blank" rel="noreferrer" className="v-recording-card__open inline-flex h-9 items-center rounded-full bg-panel px-4 text-[13px] text-ink hover:bg-surface">
                {t('shared.common.open')}
              </a>
            )}
          </div>
          <p className="text-[13px] text-muted">
            {t('onboarding.member.recording.sentAt', { at: when(m.recordingSentAt) })}{' '}
            {hoursLeft ? t('onboarding.member.recording.openFor', { n: hoursLeft, until: when(m.linkExpiresAt) }) : t('onboarding.member.recording.closed')}
          </p>
        </div>
      ) : can.has('send_recording') ? (
        <div className="flex flex-col gap-2">
          <div
            className={cx(
              'flex h-12 items-center gap-2.5 rounded-full bg-surface ps-4 pe-1.5 transition focus-within:bg-panel focus-within:ring-[1.5px] focus-within:ring-inset',
              bad ? 'ring-[1.5px] ring-danger ring-inset' : 'focus-within:ring-brand-700',
            )}
          >
            <Icon name="link" className="size-4 shrink-0 text-brand-700" strokeWidth={1.8} />
            <Input bare id="recording-card-link"
              dir="ltr"
              value={link}
              onChange={(e) => (setLink(e.target.value), setBad(false))}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={t('onboarding.member.recording.paste')}
              aria-label={t('onboarding.member.recording.link')}
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ghost"
            />
            <Button id="recording-card-send" size="sm" onClick={send} disabled={!link.trim() || act.busy}>
              {t('onboarding.member.recording.send')}
            </Button>
          </div>
          {bad && <span className="px-1 text-xs text-danger-ink">{t('onboarding.member.recording.badLink')}</span>}
        </div>
      ) : (
        <span className="flex items-center gap-2.5 text-[13px] text-soft">
          <span className="size-2 shrink-0 rounded-full bg-warn" />
          {t('onboarding.member.recording.waitingFor', { role: label('role', 'onboarding') })}
        </span>
      )}
      {(can.has('send_recording') || can.has('extend_link')) && (
        <PanelActions>
          {can.has('send_recording') && (
            <Button id="recording-card-send-without" variant="soft" size="sm" onClick={() => setWithout(true)}>
              {t('onboarding.member.recording.sendWithout')}
            </Button>
          )}
          {can.has('extend_link') &&
            settings.extendHours.map((h) => (
              <Button id={`recording-card-extend-${h}`} key={h} variant="outline" size="sm" onClick={() => act.extend(h)} disabled={act.busy}>
                {t('onboarding.member.recording.extend', { h })}
              </Button>
            ))}
        </PanelActions>
      )}
      <ReasonDialog id="recording-card-without-why"
        open={without}
        onClose={() => setWithout(false)}
        title={t('onboarding.member.recording.withoutTitle')}
        description={t('onboarding.member.recording.withoutDescription')}
        label={t('onboarding.member.recording.withoutWhy')}
        confirmLabel={t('onboarding.member.recording.sendShort')}
        onConfirm={({ text }) => act.sendRecording(null, text)}
      />
    </Panel>
  )
}
