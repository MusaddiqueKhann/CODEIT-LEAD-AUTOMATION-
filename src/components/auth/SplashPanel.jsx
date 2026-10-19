import splashVideo from '../../assets/SplashVideo/Riyadh.mp4'

/**
 * The full-bleed splash behind the sign-in card: the Riyadh loop, a gradient
 * that keeps the left column legible over it, the brand column, and the
 * right-hand column for whatever the page puts there (`children`).
 *
 * It owns the whole viewport layout so the login page is only "splash around a
 * form"; the video is decorative and hidden from assistive tech.
 */
export function SplashPanel({ children }) {
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

      <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 via-brand-950/55 to-brand-950/35 lg:to-brand-950/10" />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <div className="hidden flex-1 flex-col justify-between p-14 lg:flex">
          <img
            src="/CompanyLogo/Codeit-flat.png"
            alt="CODEIT"
            className="h-24 w-auto self-start brightness-0 invert"
          />
          <div>
            <h1 className="font-display text-3xl leading-tight font-bold whitespace-nowrap text-white xl:text-4xl">
              Training, on your schedule.
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/70">
              Schedule your training sessions in one place — start with the free
              sessions included with your product, then top up whenever you need more.
            </p>
          </div>
          <p className="text-sm text-white/50">© {2026} Code Communications & Information Technology</p>
        </div>

        {/* Sign-in column. */}
        <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-8 lg:w-[560px] lg:flex-none lg:justify-end lg:p-12">
          {children}
        </div>
      </div>
    </div>
  )
}
