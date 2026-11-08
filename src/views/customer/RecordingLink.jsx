import { Button, Icon } from '@/components'

/** The session recording: a button that opens it in a new tab, or a line saying there is none. */
export function RecordingLink({ link, t }) {
  return (
    <div className="mt-6 flex items-center gap-4 rounded-2xl bg-surface p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-800">
        <Icon name="video" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">{t.after_recording}</p>
        {!link && <p className="mt-0.5 text-sm text-muted">{t.after_no_recording}</p>}
      </div>
      {link && (
        <Button id="recording-link-open" href={link} target="_blank" rel="noreferrer">
          {t.after_open_recording}
        </Button>
      )}
    </div>
  )
}
