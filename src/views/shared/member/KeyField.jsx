import { Badge, cx, Icon, IconButton } from '@/components'

/** A value someone copies into CODEIT: an icon, the value, a small tag, then its little buttons. */
export function KeyField({ icon, tag, children, actions, mono }) {
  return (
    <span className="flex h-11 min-w-0 items-center gap-2.5 rounded-[14px] bg-field ps-2 pe-1.5">
      <span className="grid size-7.5 shrink-0 place-items-center rounded-[9px] bg-panel text-brand-700">
        <Icon name={icon} className="size-4" strokeWidth={1.8} />
      </span>
      {/* The value keeps its own direction (an email reads left to right) but sits at the row's start. */}
      <span className={cx('min-w-0 flex-1 truncate text-sm font-medium text-ink', mono && 'font-mono tracking-[0.06em]')}>
        <bdi>{children}</bdi>
      </span>
      {tag && <Badge size="xs" look="brandSoft">{tag}</Badge>}
      {actions && (
        <>
          <span className="h-5.5 w-px shrink-0 bg-brand-line" />
          {actions}
        </>
      )}
    </span>
  )
}

/** One of KeyField's small icon buttons. */
export function KeyButton({ id, icon, label, onClick, disabled }) {
  return (
    <IconButton id={id} icon={icon} label={label} title size={8} shape="key" look="key" disabled={disabled} onClick={onClick} />
  )
}
