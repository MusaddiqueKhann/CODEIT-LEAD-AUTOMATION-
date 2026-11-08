import { useState } from 'react'
import { Button, Field, IconButton, Input, Modal } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useToast } from '../../../controllers/shared/ToastContext.jsx'
import { removeHoliday, setHoliday } from '../../../controllers/admin/settings.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { fromDay, monthShort, weekdayNames } from '../../../models/rules/format.js'
import { Section } from './Section.jsx'

/** Admin: the public holidays as cards; Add holiday opens a popup. Added and removed at once (not through the Save bar). */
export function HolidaysSection({ after }) {
  const { holidays } = useConfig()
  const { toast } = useToast()
  const { t } = useLang()
  const { run, busy } = useAction(after)
  const [adding, setAdding] = useState(false)
  const [day, setDay] = useState('')
  const [name, setName] = useState('')
  const names = weekdayNames()

  const close = () => {
    setAdding(false)
    setDay('')
    setName('')
  }
  const addHoliday = async () => {
    let sessions = 0
    const done = await run(async () => (sessions = await setHoliday(day, name.trim())), t('admin.settings.week.saved'))
    if (done) {
      close()
      if (sessions) toast(t('admin.settings.week.clash', { n: sessions }), 'warn')
    }
  }

  return (
    <Section id="holidays" icon="star" action={{ label: t('admin.settings.week.add'), onClick: () => setAdding(true) }}>
      {holidays.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {holidays.map((h) => {
            const d = fromDay(h.day)
            return (
              <div key={h.day} className="relative flex animate-rise flex-col gap-3 rounded-[22px] bg-surface p-4.5">
                <IconButton id={`holidays-section-remove-${h.day}`} icon="close" label={t('admin.settings.week.remove', { name: h.name })} title={t('shared.common.remove')} size={7.5} look="panelDanger" iconClassName="size-3.5" strokeWidth={2} onClick={() => run(() => removeHoliday(h.day), t('admin.settings.week.removed'))} className="absolute end-3 top-3" />
                <span className="flex items-baseline gap-2">
                  <span className="text-stat text-ink">{d.getDate()}</span>
                  <span className="text-[13px] tracking-[0.1em] text-muted uppercase">{monthShort(d)}</span>
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] text-ink">{h.name}</span>
                  <span className="text-xs text-muted">{names[d.getDay()]}</span>
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="rounded-[20px] bg-surface p-6 text-center text-sm text-muted">{t('admin.settings.week.none')}</p>
      )}

      <Modal id="holidays-section-add"
        open={adding}
        onClose={close}
        title={t('admin.settings.week.add')}
        description={t('admin.settings.sections.holidays.sub')}
        footer={
          <>
            <Button id="holidays-section-cancel" variant="outline" onClick={close}>
              {t('shared.common.cancel')}
            </Button>
            <Button id="holidays-section-add-2" onClick={addHoliday} disabled={!day || !name.trim() || busy}>
              {t('shared.common.add')}
            </Button>
          </>
        }
      >
        <form id="holidays-section-day"
          onSubmit={(e) => {
            e.preventDefault()
            if (day && name.trim()) addHoliday()
          }}
          className="v-holidays-section__day flex flex-col gap-3"
        >
          <Field id="holidays-section-day-2" label={t('admin.settings.week.day')}>{(props) => <Input {...props} type="date" autoFocus value={day} onChange={(e) => setDay(e.target.value)} />}</Field>
          <Field id="holidays-section-name" label={t('admin.settings.week.name')}>
            {(props) => <Input {...props} placeholder={t('admin.settings.week.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
        </form>
      </Modal>
    </Section>
  )
}
