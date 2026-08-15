import { useId } from 'react'
import type { FieldSpec } from '../../../core/registry/formSchemas'
import { FieldShell, INPUT_CLASS } from './FieldShell'

type Props = {
  field: FieldSpec
  value: number
  onChange: (value: number) => void
}

export function NumberField({ field, value, onChange }: Props) {
  const id = useId()
  const belowMin = field.min !== undefined && value < field.min
  const error = belowMin ? `${field.label} must be at least ${field.min}` : null

  return (
    <FieldShell
      label={field.label}
      htmlFor={id}
      required={field.required}
      helpText={field.helpText}
      error={error}
    >
      <input
        id={id}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={field.min}
        onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        className={INPUT_CLASS}
      />
    </FieldShell>
  )
}
