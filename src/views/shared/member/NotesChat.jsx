import { useState } from 'react'
import { IconButton, Input, Panel } from '@/components'
import { useConfig } from '../../../controllers/shared/ConfigContext.jsx'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { formatStamp } from '../../../models/rules/format.js'
import { pick } from '../../../content/index.js'
import { initials } from '../../../models/rules/time.js'

/**
 * Notes and everything that happened, oldest first like a chat: what the app did is a quiet line
 * between rules, a note is a bubble. The box at the bottom adds a note, which tells everyone on
 * the member; Enter sends it.
 */
export function NotesChat({ lines, canNote, onNote }) {
  const { person, brand } = useConfig()
  const { t, lang } = useLang()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = text.trim().length > 0 && !busy

  const add = async () => {
    if (!ready) return
    setBusy(true)
    if (await onNote(text.trim())) setText('')
    setBusy(false)
  }

  return (
    <Panel id="notes-chat-title" title={t('shared.member.notes.title')} sub={t('shared.member.notes.sub')}>
      {!lines ? (
        <p className="text-sm text-muted">{t('shared.common.loading')}</p>
      ) : (
        <ol className="flex flex-col gap-3 py-1">
          {[...lines].reverse().map((l) => {
            const who = person(l.actorId)?.name ?? brand.app
            // What the app wrote is saved in both languages; a note stays as typed.
            const said = pick(lang, l.text, l.textAr)
            return l.kind === 'note' ? (
              <li key={l.id} className="flex items-end gap-2.5">
                <span className="grid size-7.5 shrink-0 place-items-center rounded-full bg-brand-700 text-[11px] text-white">{initials(who)}</span>
                <div className="flex max-w-[70%] flex-col gap-1 rounded-[18px] rounded-es-[6px] bg-brand-bubble px-3.5 py-2.5">
                  <span className="text-sm leading-normal whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">{l.text}</span>
                  <span className="text-[11px] text-soft">
                    {who} · {formatStamp(l.at)}
                  </span>
                </div>
              </li>
            ) : (
              <li key={l.id} className="flex items-center gap-3 text-[11px] text-faint">
                <span className="h-px flex-1 bg-line" />
                <span className="text-center">
                  {said.includes(who) ? said : `${said} · ${who}`} · {formatStamp(l.at)}
                </span>
                <span className="h-px flex-1 bg-line" />
              </li>
            )
          })}
        </ol>
      )}
      {canNote && (
        <div className="flex h-12 items-center gap-2.5 rounded-full bg-surface ps-4.5 pe-1.5 transition focus-within:bg-panel focus-within:ring-[1.5px] focus-within:ring-brand-700 focus-within:ring-inset">
          <Input bare id="notes-chat-write-label"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder={t('shared.member.notes.write')}
            aria-label={t('shared.member.notes.writeLabel')}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ghost"
          />
          <IconButton id="notes-chat-add" icon="send" label={t('shared.member.notes.add')} size={9} look="brand" disabled={!ready} onClick={add} />
        </div>
      )}
    </Panel>
  )
}
