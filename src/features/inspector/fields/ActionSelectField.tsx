import { RefreshCw } from 'lucide-react'
import { useId } from 'react'
import { useAutomations } from '../../../api/hooks'
import type { FieldSpec } from '../../../core/registry/formSchemas'
import type { AutomationAction } from '../../../core/types'
import { FieldShell, INPUT_CLASS } from './FieldShell'

type Props = {
  field: FieldSpec
  value: string | null
  /** Selecting an action patches actionId + actionLabel and resets params in one go. */
  onSelect: (action: AutomationAction | null) => void
}

export function ActionSelectField({ field, value, onSelect }: Props) {
  const id = useId()
  const { data, isLoading, error, retry } = useAutomations()

  if (isLoading) {
    return (
      <FieldShell label={field.label} required={field.required}>
        <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
      </FieldShell>
    )
  }

  if (error) {
    return (
      <FieldShell label={field.label} required={field.required} error="Could not load actions">
        <button
          type="button"
          onClick={retry}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={12} aria-hidden />
          Retry
        </button>
      </FieldShell>
    )
  }

  return (
    <FieldShell label={field.label} htmlFor={id} required={field.required} helpText={field.helpText}>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => {
          const action = data?.find((a) => a.id === e.target.value) ?? null
          onSelect(action)
        }}
        className={INPUT_CLASS}
      >
        <option value="" disabled>
          Choose an action…
        </option>
        {data?.map((action) => (
          <option key={action.id} value={action.id}>
            {action.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
