import clsx from 'clsx'
import { useAutomations } from '../../../api/hooks'
import type { FieldSpec } from '../../../core/registry/formSchemas'
import { FieldShell, INPUT_CLASS } from './FieldShell'

type Props = {
  field: FieldSpec
  actionId: string | null
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
}

/**
 * Renders one input per parameter of the currently selected automation action.
 * The param list comes from the API definition, so new actions need zero UI work.
 */
export function DynamicParamsField({ field, actionId, value, onChange }: Props) {
  const { data, isLoading } = useAutomations()

  if (!actionId) {
    return (
      <FieldShell label={field.label} helpText={field.helpText}>
        <p className="rounded-lg border border-dashed border-slate-200 px-2.5 py-2 text-xs text-slate-400">
          Select an action to configure its parameters
        </p>
      </FieldShell>
    )
  }

  if (isLoading) {
    return (
      <FieldShell label={field.label}>
        <div className="space-y-1.5">
          <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </FieldShell>
    )
  }

  const action = data?.find((a) => a.id === actionId)
  if (!action) {
    return (
      <FieldShell label={field.label} error="The selected action no longer exists">
        <div />
      </FieldShell>
    )
  }

  return (
    <FieldShell label={field.label} helpText={field.helpText}>
      <div className="space-y-2">
        {action.params.map((param) =>
          param === 'message' ? (
            <div key={param} className="space-y-1">
              <span className="block font-mono text-xs text-slate-500">{param}</span>
              <textarea
                value={value[param] ?? ''}
                placeholder={`Value for ${param}`}
                aria-label={`${action.label} parameter ${param}`}
                onChange={(e) => onChange({ ...value, [param]: e.target.value })}
                rows={5}
                className={clsx(INPUT_CLASS, 'resize-y font-mono')}
              />
            </div>
          ) : (
            <div key={param} className="flex items-center gap-2">
              <span className="w-20 shrink-0 truncate font-mono text-xs text-slate-500">{param}</span>
              <input
                value={value[param] ?? ''}
                placeholder={`Value for ${param}`}
                aria-label={`${action.label} parameter ${param}`}
                onChange={(e) => onChange({ ...value, [param]: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          ),
        )}
      </div>
    </FieldShell>
  )
}
