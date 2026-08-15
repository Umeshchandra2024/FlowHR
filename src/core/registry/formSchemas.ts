import type { NodeKind } from '../types'

export type SelectOption = { value: string; label: string }

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'toggle'
  | 'keyValueList'
  /** Async select fed by GET /automations; choosing an action resets `params`. */
  | 'actionSelect'
  /** Inputs generated from the chosen automation action's `params` array. */
  | 'dynamicParams'

export type FieldSpec = {
  /** Property name on the node's data object this field reads/writes. */
  name: string
  label: string
  kind: FieldKind
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  helpText?: string
  min?: number
}

/**
 * Declarative form definition per node kind. A single generic renderer turns these
 * into controlled inputs — adding a node type means adding a schema here, not a form.
 */
export const formSchemas: Record<NodeKind, FieldSpec[]> = {
  start: [
    { name: 'title', label: 'Start title', kind: 'text', required: true, placeholder: 'e.g. New hire joins' },
    {
      name: 'metadata',
      label: 'Metadata',
      kind: 'keyValueList',
      helpText: 'Optional key-value pairs attached to every run',
    },
  ],
  task: [
    { name: 'title', label: 'Title', kind: 'text', required: true, placeholder: 'e.g. Collect documents' },
    { name: 'description', label: 'Description', kind: 'textarea', placeholder: 'What needs to happen?' },
    { name: 'assignee', label: 'Assignee', kind: 'text', placeholder: 'e.g. priya@acme.com' },
    { name: 'dueDate', label: 'Due date', kind: 'date' },
    {
      name: 'customFields',
      label: 'Custom fields',
      kind: 'keyValueList',
      helpText: 'Optional extra fields for this task',
    },
  ],
  approval: [
    { name: 'title', label: 'Title', kind: 'text', required: true, placeholder: 'e.g. Manager sign-off' },
    {
      name: 'approverRole',
      label: 'Approver role',
      kind: 'select',
      options: [
        { value: 'Manager', label: 'Manager' },
        { value: 'HRBP', label: 'HRBP' },
        { value: 'Director', label: 'Director' },
      ],
    },
    {
      name: 'autoApproveThreshold',
      label: 'Auto-approve threshold',
      kind: 'number',
      min: 0,
      helpText: 'Requests at or below this amount are approved automatically',
    },
  ],
  automated: [
    { name: 'title', label: 'Title', kind: 'text', required: true, placeholder: 'e.g. Send welcome email' },
    { name: 'actionId', label: 'Action', kind: 'actionSelect', required: true },
    {
      name: 'params',
      label: 'Action parameters',
      kind: 'dynamicParams',
      helpText: 'Fields depend on the selected action',
    },
  ],
  end: [
    {
      name: 'endMessage',
      label: 'End message',
      kind: 'textarea',
      required: true,
      placeholder: 'Shown when the workflow completes',
    },
    {
      name: 'includeSummary',
      label: 'Include run summary',
      kind: 'toggle',
      helpText: 'Append a summary of all executed steps',
    },
  ],
}
