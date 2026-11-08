import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { Button, Field, FormError, Textarea, cx } from '../../components/ui/index.js'

const STARS = [1, 2, 3, 4, 5]

/** 1 to 5 stars and an optional comment. `onSend(stars, comment)` may throw; its message shows here. */
export function FeedbackForm({ t, onSend }) {
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSend(stars, comment)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <div>
        <p id="rate-label" className="text-[13px] font-medium text-ink">
          {t.after_rate}
        </p>
        <div role="group" aria-labelledby="rate-label" className="mt-2 flex gap-1">
          {STARS.map((n) => (
            <Button
              key={n}
              variant="bare"
              aria-label={String(n)}
              aria-pressed={n === stars}
              onClick={() => setStars(n)}
              className="rounded-lg p-1 transition hover:scale-110"
            >
              <Icon
                name="star"
                className={cx('size-8', n <= stars ? 'fill-current text-warn' : 'text-muted/50')}
                strokeWidth={1.5}
              />
            </Button>
          ))}
        </div>
      </div>
      <Field label={t.after_comment}>
        {(p) => <Textarea {...p} rows={3} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />}
      </Field>
      <FormError>{error}</FormError>
      <Button type="submit" size="lg" fullWidth disabled={!stars || busy}>
        {t.after_send}
      </Button>
    </form>
  )
}
