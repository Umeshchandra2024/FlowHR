import { Plus, Trash2 } from 'lucide-react'
import type { FieldSpec } from '../../../core/registry/formSchemas'
import type { KeyValue } from '../../../core/types'
import { FieldShell, INPUT_CLASS } from './FieldShell'

type Props = {
  field: FieldSpec
  value: KeyValue[]
  onChange: (value: KeyValue[]) => void
}

export function KeyValueListField({ field, value, onChange }: Props) {
  const updateRow = (id: string, patch: Partial<Omit<KeyValue, 'id'>>) => {
    onChange(value.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  return (
    <FieldShell label={field.label} required={field.required} helpText={field.helpText}>
      <div className="space-y-1.5">
        {value.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 px-2.5 py-2 text-xs text-slate-400">
            No fields yet
          </p>
        )}
        {value.map((row) => (
          <div key={row.id} className="flex items-center gap-1.5">
            <input
              value={row.key}
              placeholder="Key"
              aria-label={`${field.label} key`}
              onChange={(e) => updateRow(row.id, { key: e.target.value })}
              className={INPUT_CLASS}
            />
            <input
              value={row.value}
              placeholder="Value"
              aria-label={`${field.label} value`}
              onChange={(e) => updateRow(row.id, { value: e.target.value })}
              className={INPUT_CLASS}
            />
            <button
              type="button"
              aria-label="Remove field"
              onClick={() => onChange(value.filter((r) => r.id !== row.id))}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, { id: crypto.randomUUID(), key: '', value: '' }])}
          className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-accent-600 hover:bg-accent-50"
        >
          <Plus size={13} aria-hidden />
          Add field
        </button>
      </div>
    </FieldShell>
  )
}
