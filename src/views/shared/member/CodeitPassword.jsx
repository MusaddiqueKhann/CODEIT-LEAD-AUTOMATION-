import { useState } from 'react'
import { useLang } from '../../../controllers/shared/LangContext.jsx'
import { useCopy } from '../../../controllers/shared/useCopy.js'
import { KeyButton, KeyField } from './KeyField.jsx'

/**
 * The password for the customer's CODEIT login, hidden until asked. Copy puts it on the clipboard;
 * New makes another while the account isn't created yet (`onNew`, when this person may).
 */
export function CodeitPassword({ member: m, onNew }) {
  const copy = useCopy()
  const { t } = useLang()
  const [shown, setShown] = useState(false)
  const [fresh, setFresh] = useState(false)
  const pw = m.codeitPassword

  if (!pw) return <KeyField icon="lock">—</KeyField>
  return (
    <KeyField
      icon="lock"
      mono={shown}
      tag={t(fresh ? 'member.password.fresh' : m.accountCreatedAt ? 'member.password.inUse' : 'member.password.auto')}
      actions={
        <>
          <KeyButton icon={shown ? 'eyeOff' : 'eyeOpen'} label={t(shown ? 'member.password.hide' : 'member.password.show')} onClick={() => setShown(!shown)} />
          <KeyButton icon="copy" label={t('member.password.copy')} onClick={() => copy(pw, t('member.password.copied'))} />
          {onNew && !m.accountCreatedAt && (
            <KeyButton
              icon="refresh"
              label={t('member.password.makeNew')}
              onClick={async () => {
                if (await onNew()) {
                  setFresh(true)
                  setShown(true)
                }
              }}
            />
          )}
        </>
      }
    >
      {shown ? pw : '••••-••••-••••'}
    </KeyField>
  )
}
