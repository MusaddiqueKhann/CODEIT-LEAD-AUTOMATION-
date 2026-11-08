import splashVideo from '../../assets/SplashVideo/Riyadh.mp4'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { useBrand } from '../../controllers/shared/useBrand.js'
import { LanguageSwitch } from './LanguageSwitch.jsx'

function TeamIntro() {
  const { t } = useLang()
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight font-bold whitespace-nowrap text-white xl:text-stat">{t('auth.tagline')}</h1>
      <p className="mt-4 max-w-md text-lg text-white/70">{t('auth.intro')}</p>
    </div>
  )
}

/**
 * The full-bleed splash behind the sign-in, password and customer cards: the Riyadh loop, a gradient
 * that keeps the left column legible over it, the brand column, and the
 * right-hand column for whatever the page puts there (`children`). `intro` is the brand column's
 * words: the team's tagline unless the page passes its own (the customer's page passes none).
 * `corner` sits in the top corner on every screen size: the app's EN | ع switch, unless the page
 * passes its own (the customer's page switches only itself).
 *
 * It owns the whole viewport layout so the login page is only "splash around a
 * form"; the video is decorative and hidden from assistive tech.
 */
export function SplashPanel({ children, intro = <TeamIntro />, corner = <LanguageSwitch /> }) {
  const brand = useBrand()
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-brand-950">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={splashVideo}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 rtl:bg-gradient-to-l via-brand-950/55 to-brand-950/35 lg:to-brand-950/10" />

      {corner && <div className="absolute top-4 end-4 z-20 sm:top-6 sm:end-6">{corner}</div>}

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <div className="hidden flex-1 flex-col justify-between p-14 lg:flex">
          <img
            src="/CompanyLogo/Codeit-flat.png"
            alt={brand.app}
            className="h-24 w-auto self-start brightness-0 invert"
          />
          {intro}
          <p className="text-sm text-white/50">{brand.legal && `© ${new Date().getFullYear()} ${brand.legal}`}</p>
        </div>

        {/* Sign-in column. */}
        <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-8 lg:w-[560px] lg:flex-none lg:justify-end lg:p-12">
          {children}
        </div>
      </div>
    </div>
  )
}
