import { Card } from '../ui/index.js'

/** 02 — what a step is for. */
export function RoleCard({ role }) {
  return (
    <Card padding="none" className="p-5 shadow-[0_8px_24px_-20px_rgba(18,41,43,0.24)]">
      <div className="flex items-center gap-3">
        <span
          className="size-9.5 rounded-[10px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]"
          style={{ background: role.hex }}
        />
        <div>
          <div className="text-[15px] font-semibold text-ink">{role.name}</div>
          <div className="font-mono text-[11px] text-faint">
            {role.hex} · {role.step}
          </div>
        </div>
      </div>
      <p className="mt-3.5 text-[13px] leading-relaxed text-muted">{role.use}</p>
    </Card>
  )
}
