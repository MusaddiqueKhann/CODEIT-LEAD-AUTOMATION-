import { useState } from 'react'
import Icon from '../../../components/Icon.jsx'
import { Button, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { updateSettings } from '../../../models/data/settings.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { riyadhNow, startOfDay } from '../../../models/rules/format.js'
import { exampleFor } from '../../../models/rules/settingsExamples.js'
import { Section } from './Section.jsx'
import { useUnsaved } from '../../../controllers/shared/unsaved.js'

/* Each group's icon, then each setting: its column, the range the arrows keep to (the server
   checks again) and their step. Its words are settings.timing.fields.<column> and units.<column>;
   a group's name is settings.timing.groups.<key>. */
const GROUPS = [
  ['booking', 'calendar', [
    ['buffer_days', 3, 5],
    ['files_ready_days', 0, 10],
    ['session_minutes', 5, 480, 5],
    ['gap_minutes', 0, 120, 5],
    ['slot_step_minutes', 5, 120, 5],
    ['book_ahead_days', 1, 365],
  ]],
  ['deadlines', 'flag', [
    ['integration_due_days', 0, 30],
    ['setup_due_days', 0, 30],
  ]],
  ['picked', 'userPlus', [
    ['max_open_members', 1, 100],
  ]],
  ['after', 'video', [
    ['no_show_limit', 1, 10],
    ['link_hours', 1, 720],
    ['extend_hours'],
    ['reminder_hours'],
    ['recording_alert_hours', 1, 72],
    ['feedback_reminder_hours', 1, 720],
    ['low_rating_max', 1, 5],
  ]],
  ['dashboards', 'overview', [
    ['due_soon_days', 0, 30],
    ['ahead_days', 1, 60],
    ['recent_days', 1, 365],
  ]],
  ['signIn', 'lock', [
    ['session_hours', 1, 720],
    ['lock_tries', 1, 20],
    ['lock_window_minutes', 1, 1440],
    ['lock_minutes', 1, 1440],
  ]],
  ['phones', 'phone', [
    ['phone_min_digits', 5, 15],
    ['phone_prefix'],
  ]],
  ['alerts', 'bell', [
    ['alerts_keep_days', 1, 365],
  ]],
]
const camel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
const LISTS = ['reminder_hours', 'extend_hours']
const TEXT = ['phone_prefix']
const KEYS = GROUPS.flatMap(([, , fields]) => fields).map(([k]) => k)
const fromSettings = (settings) =>
  Object.fromEntries(KEYS.map((k) => [k, LISTS.includes(k) ? settings[camel(k)].join(', ') : String(settings[camel(k)])]))
/** The form as the server takes it: numbers, lists of numbers, and the prefix as typed. */
const toValues = (form) =>
  Object.fromEntries(
    Object.entries(form).map(([k, v]) => [
      k,
      LISTS.includes(k) ? v.split(',').map((x) => Number(x.trim())).filter(Boolean) : TEXT.includes(k) ? v : v.trim() === '' ? NaN : Number(v),
    ]),
  )

const ARROW = 'grid h-7.5 w-8.5 place-items-center rounded-[10px] transition'

/** Admin: every number the rules use, in groups of tiles; a tile being changed says what it means today. */
export function TimingTab({ after }) {
  const { settings, holidays } = useConfig()
  const { t } = useLang()
  const { run } = useAction(after)
  const [form, setForm] = useState(() => fromSettings(settings))
  const values = toValues(form)
  const ctx = { today: startOfDay(riyadhNow()), now: riyadhNow(), officeHours: settings.officeHours, holidays: new Set(holidays.map((h) => h.day)), t }
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  useUnsaved('timing', JSON.stringify(form) !== JSON.stringify(fromSettings(settings)), () =>
    run(async () => {
      if (KEYS.some((k) => Number.isNaN(values[k]))) throw new Error(t('settings.timing.fillAll'))
      return updateSettings(values)
    }),
  )

  return (
    <Section id="timing" icon="clock" className="gap-0!">
      {GROUPS.map(([group, icon, fields]) => (
        <div key={group} className="flex flex-col gap-3.5 border-t border-line py-5 last:pb-0">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
              <Icon name={icon} className="size-4.25" strokeWidth={1.8} />
            </span>
            <h3 className="text-[15px] text-ink">{t(`settings.timing.groups.${group}`)}</h3>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
            {fields.map(([k, min, max, step = 1]) => {
              const label = t(`settings.timing.fields.${k}`)
              const numeric = min !== undefined
              const by = (dir) => set(k, String(Math.min(max, Math.max(min, (Number(form[k]) || 0) + dir * step))))
              const example = exampleFor(k, values, ctx)
              return (
                <div
                  key={k}
                  className="group relative flex min-w-0 items-center gap-2.5 rounded-[22px] bg-surface py-4 ps-4.5 pe-3.5 transition focus-within:bg-panel focus-within:ring-[1.5px] focus-within:ring-brand-700 focus-within:ring-inset"
                >
                  <label className="flex min-w-0 flex-1 cursor-text flex-col gap-1">
                    <span title={label} className="truncate text-xs text-soft">
                      {label}
                    </span>
                    <input
                      value={form[k]}
                      inputMode={TEXT.includes(k) ? 'tel' : numeric ? 'numeric' : 'text'}
                      dir={TEXT.includes(k) ? 'ltr' : undefined}
                      onChange={(e) => set(k, numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
                      className={cx('w-full min-w-0 bg-transparent p-0 text-stat text-ink tabular-nums outline-none', TEXT.includes(k) && 'rtl:text-end')}
                    />
                    <span className="min-h-3.75 text-xs text-muted">{t(`settings.timing.units.${k}`)}</span>
                  </label>
                  {numeric && (
                    <span className="flex shrink-0 flex-col gap-1">
                      <Button variant="bare" aria-label={t('settings.timing.more', { what: label })} onClick={() => by(1)} className={`${ARROW} bg-brand-700 text-white hover:bg-brand-800`}>
                        <Icon name="chevronDown" className="size-3.5 rotate-180" strokeWidth={2.2} />
                      </Button>
                      <Button variant="bare" aria-label={t('settings.timing.less', { what: label })} onClick={() => by(-1)} className={`${ARROW} bg-panel text-soft hover:bg-surface-hover`}>
                        <Icon name="chevronDown" className="size-3.5" strokeWidth={2.2} />
                      </Button>
                    </span>
                  )}
                  {example && (
                    <span className="invisible absolute inset-x-1 top-full z-10 mt-1.5 rounded-xl bg-panel px-3 py-2 text-xs text-brand-800 opacity-0 shadow-card ring-1 ring-line transition group-focus-within:visible group-focus-within:opacity-100">
                      {example}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </Section>
  )
}
