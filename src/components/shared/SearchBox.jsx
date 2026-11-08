import Icon from '../Icon.jsx'
import { cx } from '../ui/index.js'

/** The design's search pill for a page header: a magnifier and one input. */
export function SearchBox({ value, onChange, placeholder, label, className = 'flex-[0_1_380px]' }) {
  return (
    <label className={cx('flex h-11 min-w-50 cursor-text items-center gap-2.5 rounded-full bg-field px-4 focus-within:ring-[1.5px] focus-within:ring-brand-700', className)}>
      <Icon name="search" className="size-4 shrink-0 text-soft" strokeWidth={2} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ghost"
      />
    </label>
  )
}
