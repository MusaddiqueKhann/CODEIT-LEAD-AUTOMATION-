import Icon from '../../../components/Icon.jsx'
import { Button, cx } from '../../../components/ui/index.js'

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
      {tag && <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-[#e6f2f1] px-2.5 text-[11px] whitespace-nowrap text-brand-800">{tag}</span>}
      {actions && (
        <>
          <span className="h-5.5 w-px shrink-0 bg-[#dfe5e5]" />
          {actions}
        </>
      )}
    </span>
  )
}

/** One of KeyField's small icon buttons. */
export function KeyButton({ icon, label, onClick, disabled }) {
  return (
    <Button
      variant="bare"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 shrink-0 place-items-center rounded-[10px] text-soft transition hover:bg-panel hover:text-brand-700 disabled:text-[#b7bec7]"
    >
      <Icon name={icon} className="size-4" strokeWidth={1.8} />
    </Button>
  )
}
