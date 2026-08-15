import clsx from 'clsx'
import type { FieldSpec } from '../../../core/registry/formSchemas'

type Props = {
  field: FieldSpec
  value: boolean
  onChange: (value: boolean) => void
}

export function ToggleField({ field, value, onChange }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-slate-600">{field.label}</p>
        {field.helpText && <p className="mt-0.5 text-xs text-slate-400">{field.helpText}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={field.label}
        onClick={() => onChange(!value)}
        className={clsx(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          value ? 'bg-accent-500' : 'bg-slate-200',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            value && 'translate-x-4',
          )}
        />
      </button>
    </div>
  )
}
