import { useId } from 'react'
import type { FieldSpec } from '../../../core/registry/formSchemas'
import { FieldShell, INPUT_CLASS } from './FieldShell'

type Props = {
  field: FieldSpec
  value: string
  onChange: (value: string) => void
}

export function SelectField({ field, value, onChange }: Props) {
  const id = useId()

  return (
    <FieldShell label={field.label} htmlFor={id} required={field.required} helpText={field.helpText}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASS}>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
