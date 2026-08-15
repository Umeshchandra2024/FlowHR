import { useId, useState } from 'react'
import type { FieldSpec } from '../../../core/registry/formSchemas'
import { FieldShell, INPUT_CLASS } from './FieldShell'

type Props = {
  field: FieldSpec
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'date'
}

export function TextField({ field, value, onChange, type = 'text' }: Props) {
  const id = useId()
  const [touched, setTouched] = useState(false)
  const error = touched && field.required && !value.trim() ? `${field.label} is required` : null

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
        type={type}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className={INPUT_CLASS}
      />
    </FieldShell>
  )
}
