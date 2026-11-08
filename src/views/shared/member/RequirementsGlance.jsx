import { Fragment, useState } from 'react'
import Icon from '../../../components/Icon.jsx'
import { FileViewer } from '../../../components/shared/FileViewer.jsx'
import { Button, cx } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { formatShort, fromDay } from '../../../models/rules/format.js'
import { byReadiness, documentsOf, dueOn, extOf, featuresFor } from '../../../models/rules/members.js'
import { Panel } from './Panel.jsx'

/** "A", "A and B", "A, B and C" (in the reader's language: `and` and `comma`), each name bold. */
function list(names, and, comma) {
  return names.map((n, i) => (
    <Fragment key={n}>
      {i > 0 && (i === names.length - 1 ? and : comma)}
      <b className="font-medium text-ink">{n}</b>
    </Fragment>
  ))
}

/** What they asked for in Sales, in a sentence, and every file: uploaded, or when it is due. */
export function RequirementsGlance({ member: m, onTab, openFile }) {
  const { label, lists } = useConfig()
  const { t } = useLang()
  const and = t('member.glance.and')
  const comma = t('member.glance.comma')
  const { keys, state, tally } = documentsOf(lists.document, m)
  const [viewing, setViewing] = useState(null) // the key
  const order = [...keys].sort(byReadiness(state))
  const features = featuresFor(lists.feature, m.plan)
  const wants = features.filter((k) => m.features?.[k] === true).map((k) => label('feature', k))
  const skips = features.filter((k) => m.features?.[k] === false).map((k) => label('feature', k))
  const hw = m.hardware ?? {}
  const hardware = hw.none
    ? t('member.glance.noHardware')
    : hw.delivered ? t('member.glance.hardwareDelivered')
    : hw.date ? t('member.glance.hardwareArrives', { date: formatShort(fromDay(hw.date)) })
    : t('member.glance.hardwareUnset')
  const plan = m.plan ? label('business_type', m.plan) : t('member.glance.noType')

  return (
    <Panel
      title={t('member.glance.title')}
      sub={t('member.glance.sub')}
      aside={
        <Button variant="outline" size="sm" onClick={() => onTab('sales')}>
          {t('member.glance.openIn', { step: label('step', 'sales') })}
          <Icon name="arrowUpRight" className="size-3.5" strokeWidth={1.8} />
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3 rounded-[20px] bg-surface-2 p-5">
          <span className="flex flex-col gap-1.5">
            <span className="eyebrow text-faint">{t('member.glance.requirements')}</span>
            <span className="text-lg leading-tight tracking-[-0.02em] text-ink">
              {plan}
              {m.branches != null && ` · ${t('member.glance.branches', { n: m.branches })}`}
              {m.users != null && ` · ${t('member.glance.users', { n: m.users })}`}
            </span>
          </span>
          <span className="text-sm leading-[1.7] text-soft">
            {wants.length > 0 && <>{t('member.glance.wants')} {list(wants, and, comma)}{m.integrations.length ? comma : '. '}</>}
            {m.integrations.length > 0 && (
              <>
                {t(wants.length ? 'member.glance.connectedToAfter' : 'member.glance.connectedTo')} {list(m.integrations.map((k) => label('integration', k)), and, comma)}.{' '}
              </>
            )}
            {skips.length > 0 && `${t('member.glance.no', { list: skips.join(comma).toLocaleLowerCase() })} `}
            {hardware}
          </span>
          <span className="mt-auto border-t border-[#e6e9ef] pt-3 text-xs text-faint">
            {[plan, m.size && label('size', m.size), m.city].filter(Boolean).join(' · ')}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <span className="flex items-center justify-between">
            <span className="eyebrow text-faint">{t('member.glance.attachments')}</span>
            <span className="text-xs text-success-ink">
              {t('member.glance.uploaded', { done: tally.done, total: tally.total })}
            </span>
          </span>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {order.map((k) => {
              const file = m.files[k]
              const days = m.due[k]
              return (
                <Button
                  key={k}
                  variant="bare"
                  disabled={!file}
                  onClick={() => setViewing(k)}
                  className={cx(
                    'flex min-w-0 flex-col gap-2 rounded-[18px] p-3 text-start transition hover:-translate-y-0.5 disabled:hover:translate-y-0',
                    file ? 'bg-surface-2' : 'border-[1.5px] border-dashed border-[#f0c48f]',
                  )}
                >
                  <span className={cx('grid h-15 place-items-center rounded-xl', file ? 'bg-panel text-[#c3cbd2]' : 'bg-warn-wash text-warn-ink')}>
                    <span className="flex flex-col items-center gap-1">
                      <Icon name="file" className="size-5" strokeWidth={1.8} />
                      <span className="text-[10px] tracking-[0.08em]">{file ? extOf(file.name) : t('member.glance.toSend')}</span>
                    </span>
                  </span>
                  <span className="truncate text-[13px] font-medium text-ink">{label('document', k)}</span>
                  <span className={cx('text-[11px]', file ? 'text-success-ink' : 'text-warn-ink')}>
                    {file ? t('member.glance.isUploaded') : days != null ? t('member.glance.due', { date: dueOn(days) }) : t('member.glance.notAdded')}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
      {viewing && (
        <FileViewer
          items={order.filter((k) => m.files[k]).map((k) => ({ key: k, label: label('document', k), file: m.files[k] }))}
          start={viewing}
          openFile={openFile}
          onClose={() => setViewing(null)}
        />
      )}
    </Panel>
  )
}
