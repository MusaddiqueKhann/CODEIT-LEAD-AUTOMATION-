import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { Button, ReasonDialog } from '../../components/ui/index.js'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { useCopy } from '../../controllers/shared/useCopy.js'
import { Notice } from '../shared/member/Notice.jsx'
import { Panel, PanelActions } from '../shared/member/Panel.jsx'
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
    <Panel
      title={t('member.session.title')}
      sub={runner ? t('member.session.with', { name: runner }) : s ? t('member.session.pickedAtHandover', { role: label('role', 'onboarding') }) : t('member.session.notBooked')}
    >
      {s ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <SessionWhen member={m} />
          {m.meetLink && !['recording', 'closed'].includes(m.stage) && (
            <div className="flex flex-wrap gap-2">
              <Button href={m.meetLink} target="_blank" rel="noreferrer" onClick={() => can.has('join') && act.join()}>
                <Icon name="video" className="size-4" strokeWidth={1.8} />
                {t('member.session.join')}
              </Button>
              <Button variant="soft" onClick={() => copy(m.meetLink, t('member.session.linkCopied'))}>
                <Icon name="copy" className="size-4" strokeWidth={1.8} />
                {t('member.session.copyLink')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        m.noShows > 0 && <Notice tone="warn" icon="calendar">{t('member.session.missed', { n: m.noShows })}</Notice>
      )}
      {can.has('finish') && (
        <PanelActions>
          <Button onClick={act.complete} disabled={act.busy}>
            {t('member.session.completed')}
          </Button>
          <Button variant="soft" onClick={() => setMissing(true)}>
            {t('member.session.noShow')}
          </Button>
        </PanelActions>
      )}
      <ReasonDialog
        open={missing}
        onClose={() => setMissing(false)}
        title={t('member.session.noShowTitle')}
        description={t('member.session.noShowDescription', { step: label('step', 'sales') })}
        label={t('member.session.note')}
        optional
        confirmLabel={t('member.session.markNoShow')}
        tone="danger"
        onConfirm={({ text }) => act.noShow(text)}
      />
    </Panel>
  )
}
