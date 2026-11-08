import { useConfig } from '../../controllers/shared/ConfigContext.jsx'
import { Option } from './Option.jsx'

/**
 * Chips over a list of options ({ key, label }). `isOn(key)` marks the picked ones. With `list`
 * (a Settings → Lists name) each chip shows that option's name in the reader's language.
 */
export function Chips({ items, isOn, onPick, list }) {
  const { label } = useConfig()
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((o) => (
        <Option
          key={o.key}
          on={isOn(o.key)}
          onClick={() => onPick(o.key)}
          className="h-10 rounded-full px-4 text-sm whitespace-nowrap"
        >
          {list ? label(list, o.key) : o.label}
        </Option>
      ))}
    </div>
  )
}
