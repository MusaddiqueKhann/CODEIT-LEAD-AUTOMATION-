import { useState } from 'react'
import { Button, Icon, Notice, Panel, PanelActions, ReasonDialog } from '@/components'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { useCopy } from '../../controllers/shared/useCopy.js'
import { SessionWhen } from '../shared/member/SessionWhen.jsx'

/** The training session: when, who runs it, the Meet link, and Completed / No-show. Sales books and moves it. */
export function SessionCard({ member: m, can, act }) {
  const { person, label } = useConfig()
  const { t } = useLang()
  const copy = useCopy()
  const [missing, setMissing] = useState(false)
  const s = m.session
  const runner = person(m.onboardingId)?.name

  return (
    <Panel id="session-card-title"
      title={t('onboarding.member.session.title')}
      sub={runner ? t('onboarding.member.session.with', { name: runner }) : s ? t('onboarding.member.session.pickedAtHandover', { role: label('role', 'onboarding') }) : t('onboarding.member.session.notBooked')}
    >
      {s ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <SessionWhen member={m} />
          {m.meetLink && !['recording', 'closed'].includes(m.stage) && (
            <div className="flex flex-wrap gap-2">
              <Button id="session-card-join" href={m.meetLink} target="_blank" rel="noreferrer" onClick={() => can.has('join') && act.join()}>
                <Icon name="video" className="size-4" strokeWidth={1.8} />
                {t('onboarding.member.session.join')}
              </Button>
              <Button id="session-card-copy-link" variant="soft" onClick={() => copy(m.meetLink, t('onboarding.member.session.linkCopied'))}>
                <Icon name="copy" className="size-4" strokeWidth={1.8} />
                {t('onboarding.member.session.copyLink')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        m.noShows > 0 && <Notice size="md" tone="warn" icon="calendar">{t('onboarding.member.session.missed', { n: m.noShows })}</Notice>
      )}
      {can.has('finish') && (
        <PanelActions>
          <Button id="session-card-completed" onClick={act.complete} disabled={act.busy}>
            {t('onboarding.member.session.completed')}
          </Button>
          <Button id="session-card-no-show" variant="soft" onClick={() => setMissing(true)}>
            {t('onboarding.member.session.noShow')}
          </Button>
        </PanelActions>
      )}
      <ReasonDialog id="session-card-note"
        open={missing}
        onClose={() => setMissing(false)}
        title={t('onboarding.member.session.noShowTitle')}
        description={t('onboarding.member.session.noShowDescription', { step: label('step', 'sales') })}
        label={t('onboarding.member.session.note')}
        optional
        confirmLabel={t('onboarding.member.session.markNoShow')}
        tone="danger"
        onConfirm={({ text }) => act.noShow(text)}
      />
    </Panel>
  )
}
