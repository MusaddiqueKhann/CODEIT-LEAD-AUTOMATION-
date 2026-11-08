import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Icon, LanguageSwitch, Notice, SplashCard, SplashPanel } from '@/components'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { rateAfter, useCustomerPage } from '../../controllers/customer.js'
import { fill, formatFor } from '../../models/rules/format.js'
import { refusalText } from '../../models/rules/refusal.js'
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
  const { data: page, error, reload } = useCustomerPage(token, picked)
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
      // The refusal in the page's language.
      throw new Error(refusalText(lang, err))
    }
  }

  if (error)
    return (
      <SplashPanel page="customer" intro={null} corner={corner}>
        <div className="w-full max-w-md">
          <Notice role="alert">{errorText(error)}</Notice>
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
              <Notice tone="success" icon="checkCircle" align="center" strokeWidth={1.7} role="status" className="mt-6">
                {say('after_thanks')}
              </Notice>
            ) : (
              <FeedbackForm t={page.texts} lang={lang} onSend={send} />
            )}
          </SplashCard>
        )}
      </div>
    </SplashPanel>
  )
}
