import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'
import { LanguageSwitch } from '../../components/layout/LanguageSwitch.jsx'
import { SplashCard } from '../../components/layout/SplashCard.jsx'
import { SplashPanel } from '../../components/layout/SplashPanel.jsx'
import { FormError, cx } from '../../components/ui/index.js'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { getAfter, rateAfter } from '../../models/data/after.js'
import { useRows } from '../../controllers/shared/useRows.js'
import { fill, formatFor } from '../../models/rules/format.js'
import { translate } from '../../content/index.js'
import { TONES } from '../../components/tones.js'
import { FeedbackForm } from './FeedbackForm.jsx'
import { RecordingLink } from './RecordingLink.jsx'

/**
 * The customer's page (/after/:token), opened from the recording email without signing in: the
 * recording and a 1 to 5 star rating, in the member's language (Arabic right to left), or the one
 * the customer picks on its own EN | ع switch. Every word comes from Settings → Emails & texts; the
 * server decides whether the link is still open.
 */
export function CustomerAfterPage() {
  const { token } = useParams()
  const { errorText, setPageLang } = useLang()
  const [picked, setPicked] = useState(null)
  const { data: page, error, reload } = useRows(() => getAfter(token, picked), `${token}:${picked}`)
  const [sent, setSent] = useState(false)
  const lang = page?.language ?? picked ?? 'en'
  // The page's own language switch: it changes only this page.
  const corner = <LanguageSwitch lang={lang} onPick={setPicked} />
  // The whole page mirrors with the customer's language, not the team's.
  useEffect(() => {
    setPageLang(lang)
    return () => setPageLang(null)
  }, [lang, setPageLang])

  async function send(stars, comment) {
    try {
      await rateAfter(token, stars, comment)
      setSent(true)
    } catch (err) {
      reload() // closed or already rated meanwhile: the page then says so in the customer's language
      // The refusal in the page's language: the server's sentence is the English.
      throw new Error((lang === 'ar' && err.code && translate('ar', `errors.${err.code}`)) || err.message)
    }
  }

  if (error)
    return (
      <SplashPanel intro={null} corner={corner}>
        <div className="w-full max-w-md">
          <FormError>{errorText(error)}</FormError>
        </div>
      </SplashPanel>
    )
  if (!page) return <SplashPanel intro={null} corner={corner} />

  const values = {
    name: page.name,
    company: page.company,
    // One left-to-right piece that doesn't break, or "+966 11 000 0000" scrambles inside Arabic.
    support_phone: `\u2066${page.supportPhone.replaceAll(' ', '\u00a0')}\u2069`,
    expires: page.expiresAt && formatFor(page.language, page.expiresAt),
  }
  const say = (key) => fill(page.texts[key] ?? '', values)

  return (
    <SplashPanel intro={null} corner={corner}>
      <div dir={page.language === 'ar' ? 'rtl' : 'ltr'} lang={page.language} className="w-full max-w-md">
        {!page.found ? (
          <SplashCard title={say('after_not_found_title')} sub={say('after_not_found')} />
        ) : page.closed ? (
          <SplashCard title={say('after_closed_title')} sub={say('after_closed_body')} />
        ) : (
          <SplashCard title={say('after_title')} sub={say('after_intro')}>
            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted">
              <Icon name="clock" className="size-4" />
              {say('after_open_until')}
            </p>
            <RecordingLink link={page.recordingLink} t={page.texts} />
            {sent || page.rated ? (
              <p role="status" className={cx('mt-6 flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm', TONES.success.fill, TONES.success.text)}>
                <Icon name="checkCircle" className="size-4 shrink-0" />
                {say('after_thanks')}
              </p>
            ) : (
              <FeedbackForm t={page.texts} onSend={send} />
            )}
          </SplashCard>
        )}
      </div>
    </SplashPanel>
  )
}
