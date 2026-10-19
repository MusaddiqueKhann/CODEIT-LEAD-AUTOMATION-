import { Button, cx } from '../ui/index.js'

/**
 * One step on the rail. A thin bar on the left is the only marker: dark for
 * the current step, soft brand for a finished one, a hairline for the rest.
 * A finished step is a button that takes you back to it and shows what was
 * chosen; the current step shows its title and a one-line hint.
 */
export function StepBlock({ state, number, eyebrow, title, value, hint, onClick }) {
  const done = state === 'done'
  const current = state === 'current'
  const Tag = done ? Button : 'div'

  return (
    <Tag
      {...(done ? { variant: 'bare', onClick } : {})}
      aria-current={current ? 'step' : undefined}
      className={cx(
        'group relative w-full rounded-xl py-2.5 pr-4 pl-8 text-left transition duration-200 ease-out short:py-2 [&>*]:transition-colors [&>*]:duration-200',
        current ? 'bg-surface-2' : done ? 'hover:bg-surface' : '',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'absolute top-2.5 bottom-2.5 left-3 w-[3px] rounded-full',
          current ? 'bg-brand-800' : done ? 'bg-brand-400' : 'bg-line',
        )}
      />
      <span
        className={cx(
          'block text-[10px] font-semibold tracking-[0.16em] uppercase',
          current ? 'text-brand-900' : done ? 'text-muted' : 'text-faint',
        )}
      >
        {String(number).padStart(2, '0')} — {eyebrow}
      </span>
      <span className="mt-0.5 flex items-center justify-between gap-3">
        <span
          className={cx(
            'truncate text-base leading-tight font-bold',
            current || done ? 'text-ink' : 'text-faint',
          )}
        >
          {done ? value : title}
        </span>
        {done && (
          <span className="shrink-0 text-xs font-semibold text-brand-800 transition group-hover:text-brand-700">
            Edit
          </span>
        )}
      </span>
      {current && (
        <span className="mt-0.5 block truncate text-xs text-muted short:hidden">{hint}</span>
      )}
    </Tag>
  )
}
