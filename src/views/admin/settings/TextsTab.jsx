import { useState } from 'react'
import { Tabs, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { saveText, updateSettings } from '../../../models/data/settings.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { MESSAGES, messageOf, unknownPlaceholders } from '../../../models/rules/placeholders.js'
import { EmailMessage } from './EmailMessage.jsx'
import { Section } from './Section.jsx'
import { useUnsaved } from '../../../controllers/shared/unsaved.js'

/* Who reads each group of messages, one tab each; their words are settings.texts.groups.<group> and <group>Sub. */
const GROUPS = ['customer', 'team', 'page', 'calendar', 'activity']

/**
 * Admin: the wording of every email, the customer page, the calendar event and the alert and
 * activity lines, in English and Arabic, a tab per reader, each message a row on a timeline;
 * customer emails can be turned off. Edits save from the bar. Every tab stays mounted (hidden), so
 * an unsaved edit survives a change of tab.
 */
export function TextsTab({ after }) {
  const { texts, settings } = useConfig()
  const { t } = useLang()
  const { run } = useAction(after)
  const [off, setOff] = useState(settings.emailsOff)
  const [group, setGroup] = useState('customer')
  const byMessage = Object.groupBy(Object.keys(texts).sort(), messageOf)
  const messages = Object.entries(MESSAGES).filter(([key]) => byMessage[key])
  const inGroup = (g) => messages.filter(([, m]) => m.group === g)

  useUnsaved('emails_off', [...off].sort().join() !== [...settings.emailsOff].sort().join(), () => run(() => updateSettings({ emails_off: off })))

  return (
    <Section id="texts" icon="mail">
      <Tabs
        size="sm"
        className="flex-wrap self-start"
        value={group}
        onChange={setGroup}
        items={GROUPS.map((g) => ({
          key: g,
          // The count reads as part of the name, as in the design (the tab's own gap is pulled in).
          label: (
            <>
              {t(`settings.texts.groups.${g}`)}
              <span className="-ms-1.5 opacity-60">{inGroup(g).length}</span>
            </>
          ),
        }))}
      />
      <p className="text-[13px] text-muted">{t(`settings.texts.groups.${group}Sub`)}</p>
      {GROUPS.map((g) => (
        <div key={g} role="tabpanel" className={cx('relative flex flex-col', g !== group && 'hidden')}>
          <span aria-hidden="true" className="absolute inset-s-4.75 top-6 bottom-6 w-0.5 bg-edge" />
          {inGroup(g).map(([key, m]) => (
            <EmailMessage
              key={`${key}:${byMessage[key].map((k) => texts[k].en + texts[k].ar).join()}`}
              id={key}
              message={m}
              keys={byMessage[key]}
              on={!off.includes(key)}
              onToggle={m.canTurnOff ? (v) => setOff((o) => (v ? o.filter((x) => x !== key) : [...o, key])) : null}
              onSave={(k, en, ar) =>
                run(async () => {
                  const bad = unknownPlaceholders(`${en} ${ar}`, m.placeholders)
                  if (bad.length) {
                    throw new Error(t('settings.texts.refused', { title: m.group === 'activity' ? key : t(`settings.texts.messages.${key}`), words: bad.map((w) => `{${w}}`).join(', ') }))
                  }
                  return saveText(k, en, ar)
                })
              }
              run={run}
            />
          ))}
        </div>
      ))}
    </Section>
  )
}
