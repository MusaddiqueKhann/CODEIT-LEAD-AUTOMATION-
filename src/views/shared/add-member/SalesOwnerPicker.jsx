import { Card, Field, Select } from '../../../components/ui/index.js'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'

/** Admin only: who owns the new member in Sales (whoever adds it otherwise). */
export function SalesOwnerPicker({ value, onChange }) {
  const { team, label } = useConfig()
  const { t } = useLang()
  const sales = team.filter((p) => p.role === 'sales' && p.active)
  return (
    <Card radius="rounded-[22px]" className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-60 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium text-ink">{t('members.owner.title')}</span>
        <span className="text-sm text-muted">{t('members.owner.sub', { role: label('role', 'sales') })}</span>
      </div>
      <Field label={label('role', 'sales')} className="min-w-60">
        {(props) => (
          <Select {...props} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">{t('common.pickOne')}</option>
            {sales.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </Card>
  )
}
