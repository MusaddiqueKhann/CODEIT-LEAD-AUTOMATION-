import Icon from '../Icon.jsx'
import { cx } from '../cx.js'

/* header: the pill in a page header. panel: a white box inside a grey column (the Lists finder). */
const LOOKS = {
  header: { box: 'min-w-50 gap-2.5 rounded-full bg-field px-4', icon: 'text-soft', stroke: 2, input: 'text-sm' },
  panel: { box: 'gap-2 rounded-xl bg-panel px-3.5 text-sm', icon: 'text-muted', stroke: 1.8, input: '' },
}

/** The design's search box: a magnifier and one input. `label` is its name for a screen reader. */
export function SearchBox({ id, value, onChange, placeholder, label, look = 'header', className = look === 'header' ? 'flex-[0_1_380px]' : undefined }) {
  const l = LOOKS[look]
  return (
    <label className={cx('ui-search flex h-11 cursor-text items-center focus-within:ring-[1.5px] focus-within:ring-brand-700', l.box, className)}>
      <Icon name="search" className={cx('size-4 shrink-0', l.icon)} strokeWidth={l.stroke} />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={cx('ui-search__input min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ghost', l.input)}
      />
    </label>
  )
}
