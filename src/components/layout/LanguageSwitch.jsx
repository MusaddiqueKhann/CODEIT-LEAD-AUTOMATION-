import Icon from '../Icon.jsx'
import { useLang } from '../../controllers/shared/LangContext.jsx'
import { cx } from '../cx.js'

/* Each language's name in its own script, and its short mark, as the button offers it. */
const OTHER = { en: ['ar', 'العربية', 'ع'], ar: ['en', 'English', 'EN'] }

/**
 * One button that switches to the other language, named in that language ("العربية" / "English").
 * On a teal or dark surface (the sidebar, the sign-in splash). The app's language by default; the
 * customer page passes its own `lang` and `onPick`, which change only that page. `short` is the
 * square version beside Sign out in the sidebar's profile card: just "ع" or "EN".
 */
export function LanguageSwitch({ lang, onPick, short, className }) {
  const app = useLang()
  const [next, name, mark] = OTHER[lang ?? app.lang]
  if (short) {
    return (
      <button
        type="button"
        lang={next}
        onClick={() => (onPick ?? app.setLang)(next)}
        aria-label={name}
        title={name}
        className={cx('grid size-9 shrink-0 place-items-center rounded-[11px] bg-white/14 text-[13px] transition hover:bg-white/24 focus-visible:outline-white', className)}
      >
        {mark}
      </button>
    )
  }
  return (
    <button
      type="button"
      lang={next}
      onClick={() => (onPick ?? app.setLang)(next)}
      className={cx(
        'inline-flex h-8 items-center gap-1.5 rounded-full bg-white/14 px-3 text-xs text-white transition hover:bg-white/24 focus-visible:outline-white',
        className,
      )}
    >
      <Icon name="globe" className="size-3.5" strokeWidth={1.8} />
      {name}
    </button>
  )
}
