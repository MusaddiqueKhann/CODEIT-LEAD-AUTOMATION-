import { cx } from '../cx.js'
import { Field, Input } from '../ui/Field.jsx'

/**
 * A labelled text box: the kit's Field and Input, so its label, id and look match every other form.
 * A value that always reads left to right (`dir="ltr"`: an email, a phone, a number) still sits at
 * the start of the box on an Arabic page, so the form stays a mirror.
 */
export function TextField({ id, label, ...rest }) {
  return (
    <Field id={id} label={label} className="min-w-0">
      {(props) => <Input {...props} {...rest} className={cx('min-w-0', rest.dir === 'ltr' && 'rtl:text-right')} />}
    </Field>
  )
}
