import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { cx } from '../../../components/ui/index.js'
import { initials } from '../../../models/rules/time.js'

/** Who runs a session: their initials on the deep teal circle, or a dashed circle while nobody is picked. */
export function SessionAvatar({ item, className }) {
  const { person } = useConfig()
  const { t } = useLang()
  const who = person(item.personId)
  return (
    <span
      title={who ? t('calendar.withPerson', { name: who.name }) : t('calendar.nobodyYet')}
      className={cx('grid shrink-0 place-items-center rounded-full', who ? 'bg-brand-900 text-white' : 'border-[1.5px] border-dashed border-faint text-faint', className)}
    >
      {who ? initials(who.name) : '?'}
    </span>
  )
}
