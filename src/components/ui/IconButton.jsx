import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { cx } from '../cx.js'
import { Button } from './Button.jsx'

/* The design's icon-only controls: a square of `size`, a `shape`, and one of its `look`s. */
const SIZES = {
  7.5: 'size-7.5',
  8: 'size-8',
  8.5: 'size-8.5',
  9: 'size-9',
  10: 'size-10',
  11: 'size-11',
  13: 'size-13',
  14: 'size-14',
  arrow: 'h-7.5 w-8.5', // a Timing tile's up/down
}
const SHAPES = { round: 'rounded-full', square: 'rounded-xl', key: 'rounded-[10px]' }
const LOOKS = {
  soft: 'bg-surface text-ink hover:bg-surface-hover',
  softMuted: 'bg-surface text-soft hover:bg-surface-hover',
  softDanger: 'bg-danger-bg/60 text-danger hover:bg-danger-bg',
  panel: 'bg-panel text-soft hover:bg-tint hover:text-brand-700',
  panelQuiet: 'bg-panel text-soft hover:bg-surface-hover',
  panelDanger: 'bg-panel text-danger-ink hover:bg-danger-bg',
  outline: 'text-ink ring-[1.5px] ring-edge ring-inset hover:bg-surface',
  outlinePanel: 'bg-panel text-ink ring-[1.5px] ring-edge ring-inset',
  brand: 'bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-200',
  key: 'text-soft hover:bg-panel hover:text-brand-700 disabled:text-off-disabled',
  glass: 'bg-white/12 text-white hover:bg-white/22 disabled:opacity-30 disabled:hover:bg-white/12', // on the dark file viewer
  hero: 'bg-white/16 text-white hover:bg-white/26', // on a teal greeting card
}

/**
 * A control that is only an icon. `label` is what a screen reader says (and the hover tip when
 * `title` is true or a string). With `to` it is a router link, with `href` a plain link (e.g. a
 * download), otherwise a button. `className` adds the place's own touches (position, a hover tilt).
 */
export function IconButton({ icon, label, title, to, href, size = 10, shape = 'round', look = 'soft', iconClassName = 'size-4', strokeWidth = 1.8, className, ...rest }) {
  const props = {
    'aria-label': label,
    title: title === true ? label : title || undefined,
    className: cx('ui-icon-button', `ui-icon-button--${look}`, 'grid shrink-0 place-items-center transition', SIZES[size], SHAPES[shape], LOOKS[look], className),
    ...rest,
  }
  const inner = <Icon name={icon} className={iconClassName} strokeWidth={strokeWidth} />
  if (to) return <Link to={to} {...props}>{inner}</Link>
  if (href) return <a href={href} {...props}>{inner}</a>
  return <Button variant="bare" {...props}>{inner}</Button>
}
