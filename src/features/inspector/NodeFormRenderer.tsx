import { formSchemas, type FieldSpec } from '../../core/registry/formSchemas'
import type { KeyValue, NodeData, NodeKind } from '../../core/types'
import { ActionSelectField } from './fields/ActionSelectField'
import { DynamicParamsField } from './fields/DynamicParamsField'
import { KeyValueListField } from './fields/KeyValueListField'
import { NumberField } from './fields/NumberField'
import { SelectField } from './fields/SelectField'
import { TextAreaField } from './fields/TextAreaField'
import { TextField } from './fields/TextField'
import { ToggleField } from './fields/ToggleField'

type Props = {
  kind: NodeKind
  data: NodeData
  onPatch: (patch: Partial<NodeData>) => void
}

/**
 * Turns a node kind's declarative schema into controlled inputs.
 * This component is the only place that maps FieldKind → component, so a new
 * input kind is one `case` here and one field component file.
 */
export function NodeFormRenderer({ kind, data, onPatch }: Props) {
  const schema = formSchemas[kind]
  // Schema field names always exist on the matching data shape (both are defined
  // per-kind); the record view lets the generic renderer read them.
  const record = data as Record<string, unknown>
  const patch = (name: string, value: unknown) => onPatch({ [name]: value } as Partial<NodeData>)

  const renderField = (field: FieldSpec) => {
    switch (field.kind) {
      case 'text':
        return (
          <TextField field={field} value={String(record[field.name] ?? '')} onChange={(v) => patch(field.name, v)} />
        )
      case 'date':
        return (
          <TextField
            field={field}
            type="date"
            value={String(record[field.name] ?? '')}
            onChange={(v) => patch(field.name, v)}
          />
        )
      case 'textarea':
        return (
          <TextAreaField
            field={field}
            value={String(record[field.name] ?? '')}
            onChange={(v) => patch(field.name, v)}
          />
        )
      case 'number':
        return (
          <NumberField
            field={field}
            value={Number(record[field.name] ?? 0)}
            onChange={(v) => patch(field.name, v)}
          />
        )
      case 'select':
        return (
          <SelectField
            field={field}
            value={String(record[field.name] ?? '')}
            onChange={(v) => patch(field.name, v)}
          />
        )
      case 'toggle':
        return (
          <ToggleField
            field={field}
            value={Boolean(record[field.name])}
            onChange={(v) => patch(field.name, v)}
          />
        )
      case 'keyValueList':
        return (
          <KeyValueListField
            field={field}
            value={(record[field.name] as KeyValue[] | undefined) ?? []}
            onChange={(v) => patch(field.name, v)}
          />
        )
      case 'actionSelect':
        return (
          <ActionSelectField
            field={field}
            value={(record[field.name] as string | null | undefined) ?? null}
            onSelect={(action) =>
              // Switching action rewires the whole automated config atomically:
              // params from a previous action would be meaningless.
              onPatch({
                actionId: action?.id ?? null,
                actionLabel: action?.label ?? null,
                params: {},
              } as Partial<NodeData>)
            }
          />
        )
      case 'dynamicParams':
        return (
          <DynamicParamsField
            field={field}
            actionId={(record['actionId'] as string | null | undefined) ?? null}
            value={(record[field.name] as Record<string, string> | undefined) ?? {}}
            onChange={(v) => patch(field.name, v)}
          />
        )
    }
  }

  return (
    <div className="space-y-4">
      {schema.map((field) => (
        <div key={field.name}>{renderField(field)}</div>
      ))}
    </div>
  )
}
