import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { MemberAvatar } from '../../components/shared/index.js'
import { Badge, Button, cx } from '../../components/ui/index.js'
import { useAuth } from '../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { formatStamp, fromServer } from '../../models/rules/format.js'
import { initials } from '../../models/rules/time.js'
import { Panel } from '../shared/member/Panel.jsx'

const BOX = 'flex min-w-0 flex-[1_1_320px] flex-col gap-3 rounded-[20px] bg-surface-2 p-4.5'

/**
 * Two sides of how the session went: the Onboarding Member's own words (theirs or the Admin's to
 * write, once the session has happened) and the customer's stars and comment from the feedback page.
 */
export function FeedbackCard({ member: m, act }) {
  const { profile, role } = useAuth()
  const { person, settings, label } = useConfig()
  const { t } = useLang()
  const runner = person(m.onboardingId)
  const [text, setText] = useState(m.onboardingFeedback ?? '')
  const mayWrite = !!m.completedAt && (role === 'admin' || profile.id === m.onboardingId)
  const changed = text.trim() !== (m.onboardingFeedback ?? '')
  const low = m.rating && m.rating <= settings.lowRatingMax

  return (
    <Panel title={t('member.feedback.title')} sub={t('member.feedback.sub', { role: label('role', 'onboarding') })}>
      <div className="flex flex-wrap gap-3">
        <div className={BOX}>
          <div className="flex items-center gap-3">
            <span className={cx('grid size-9 shrink-0 place-items-center rounded-full text-xs', runner ? 'bg-brand-900 text-white' : 'bg-panel text-faint')}>
              {runner ? initials(runner.name) : '?'}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[11px] text-faint">{label('role', 'onboarding')}</span>
              <span className="truncate text-sm font-medium text-ink">{runner?.name ?? t('member.feedback.pickedAtHandover')}</span>
            </span>
            <Badge size="sm" tone={m.onboardingFeedback ? 'success' : 'warn'}>
              {t(m.onboardingFeedback ? 'member.feedback.saved' : 'member.feedback.waiting')}
            </Badge>
          </div>
          {mayWrite ? (
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('member.feedback.prompt')}
              className="min-h-24 w-full resize-y rounded-[14px] bg-panel px-3.5 py-3 text-sm leading-normal text-ink outline-none placeholder:text-ghost focus:ring-[1.5px] focus:ring-brand-700 focus:ring-inset"
            />
          ) : (
            <p className={cx('min-h-24 rounded-[14px] bg-panel px-3.5 py-3 text-sm leading-normal whitespace-pre-wrap', m.onboardingFeedback ? 'text-ink' : 'text-ghost')}>
              {m.onboardingFeedback ?? t('member.feedback.prompt')}
            </p>
          )}
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-[11px] text-faint">{t('member.feedback.writtenAfter')}</span>
            {mayWrite && (
              <Button size="sm" onClick={() => act.feedback(text)} disabled={!changed || act.busy}>
                {t('member.feedback.save')}
              </Button>
            )}
          </div>
        </div>

        <div className={BOX}>
          <div className="flex items-center gap-3">
            <MemberAvatar name={m.name} size="size-9 rounded-full text-xs" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[11px] text-faint">{t('member.feedback.client')}</span>
              <span className="truncate text-sm font-medium text-ink">{m.name}</span>
            </span>
            <Badge size="sm" tone={m.rating ? (low ? 'warn' : 'success') : 'warn'}>
              {m.rating ? t('member.feedback.ofFive', { n: m.rating }) : t(m.recordingSentAt ? 'member.feedback.waiting' : 'member.feedback.notSent')}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5" aria-label={m.rating ? t('member.feedback.stars', { n: m.rating }) : t('member.feedback.noRating')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Icon key={n} name="star" className={cx('size-4.5', n <= (m.rating ?? 0) ? 'fill-warn text-warn' : 'text-[#d5dae2]')} strokeWidth={1.8} />
            ))}
            <span className="ms-2 text-xs text-faint">{m.ratedAt ? t('member.feedback.rated', { at: formatStamp(fromServer(m.ratedAt)) }) : t('member.feedback.noRating')}</span>
          </div>
          <p className={cx('min-h-16 rounded-[14px] bg-panel px-3.5 py-3 text-[13px] leading-normal', m.ratingComment ? 'text-ink' : 'text-ghost')}>
            {m.ratingComment ? `“${m.ratingComment}”` : t('member.feedback.commentHere')}
          </p>
          <span className="flex items-center gap-2 text-[11px] text-faint">
            <Icon name="mail" className="size-3.5" strokeWidth={1.8} />
            {t('member.feedback.linkGoes', { language: t(m.language === 'ar' ? 'common.arabic' : 'common.english') })}
          </span>
        </div>
      </div>
    </Panel>
  )
}
