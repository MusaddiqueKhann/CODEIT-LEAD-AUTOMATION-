import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader.jsx'
import Icon from '../../../components/Icon.jsx'
import { Button, Card, Tabs, cx } from '../../../components/ui/index.js'
import { useAuth } from '../../../controllers/shared/AuthContext.jsx'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { markRead } from '../../../models/data/alerts.js'
import { useAction } from '../../../controllers/shared/useAction.js'
import { useAlerts } from '../../../controllers/shared/useAlerts.js'
import { ROUTES, memberPath } from '../../../routes/paths.js'
import { AlertRow, COLUMNS } from './AlertRow.jsx'

/** Everything that needs you, newest first and live. They also come by email if you turned that on. */
export function AlertsPage() {
  const { profile } = useAuth()
  const { settings } = useConfig()
  const { t } = useLang()
  const navigate = useNavigate()
  const alerts = useAlerts(profile.id)
  const { run } = useAction(alerts.reload)
  const [tab, setTab] = useState('all')
  const list = alerts.data ?? []
  const unread = list.filter((a) => !a.readAt)
  const shown = tab === 'unread' ? unread : list

  const read = (a) => run(() => markRead([a.id]))
  const open = async (a) => {
    if (!a.readAt) await markRead([a.id])
    navigate(a.code ? memberPath(a.code) : ROUTES.team)
  }

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-2rem)]">
      <PageHeader
        title={t('alerts.title')}
        sub={t('alerts.sub', { unread: unread.length, n: settings.alertsKeepDays })}
        actions={
          <>
            <Tabs
              items={[
                { key: 'all', label: t('alerts.tabs.all'), count: list.length },
                { key: 'unread', label: t('alerts.tabs.unread'), count: unread.length },
              ]}
              value={tab}
              onChange={setTab}
            />
            <Button variant="outline" size="lg" disabled={!unread.length} onClick={() => run(() => markRead(), t('alerts.allMarked'))}>
              {t('alerts.markAll')}
            </Button>
          </>
        }
      />
      <Card padding="none" clip className="flex animate-rise flex-col [animation-delay:.08s] lg:min-h-0 lg:flex-1">
        <div className="scrollbar-slim min-h-0 flex-1 overflow-auto px-3 pb-3">
          <div className="min-w-180">
            <div className="sticky top-0 z-2 bg-panel pt-3 pb-1.5">
              <div className={cx(COLUMNS, 'h-12 rounded-2xl bg-field text-[13px] font-medium text-ink-2')}>
                <span className="ps-14">{t('alerts.columns.alert')}</span>
                <span>{t('alerts.columns.member')}</span>
                <span>{t('alerts.columns.when')}</span>
                <span>{t('alerts.columns.action')}</span>
                <span />
              </div>
            </div>
            {!alerts.data ? (
              <p className="px-6 py-12 text-center text-sm text-muted">{t('common.loading')}</p>
            ) : shown.length === 0 ? (
              <div className="flex min-h-70 flex-col items-center justify-center gap-3 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-tint text-brand-700">
                  <Icon name="bell" className="size-6.5" strokeWidth={1.8} />
                </span>
                <span className="text-lg tracking-[-0.01em] text-ink">{t('alerts.empty.title')}</span>
                <span className="text-sm text-muted">{t('alerts.empty.sub')}</span>
              </div>
            ) : (
              shown.map((a, i) => <AlertRow key={a.id} alert={a} index={i} onRead={read} onOpen={open} />)
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
