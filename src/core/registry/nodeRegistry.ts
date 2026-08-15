import { CheckCircle2, ClipboardList, Play, UserCheck, Zap, type LucideIcon } from 'lucide-react'
import type { NodeDataOf, NodeKind } from '../types'

/** Static Tailwind class tokens per node kind (Tailwind cannot build class names dynamically). */
export type NodeColorTokens = {
  /** Icon chip background + foreground. */
  chip: string
  /** Ring shown when the node is selected. */
  ring: string
  /** Raw hex used for edges, minimap, and the simulation pulse. */
  hex: string
}

export type NodeDefinition<K extends NodeKind = NodeKind> = {
  kind: K
  label: string
  description: string
  icon: LucideIcon
  color: NodeColorTokens
  /** null = unlimited. */
  maxIncoming: number | null
  maxOutgoing: number | null
  /** At most this many instances on the canvas (null = unlimited). */
  maxInstances: number | null
  createDefaultData: () => NodeDataOf[K]
  subtitle: (data: NodeDataOf[K]) => string
  /** Field-level issues for this node's current data. Empty array = valid. */
  validate: (data: NodeDataOf[K]) => string[]
}

/** Union of concrete per-kind definitions (distributes K instead of unioning the data params). */
export type AnyNodeDefinition = { [K in NodeKind]: NodeDefinition<K> }[NodeKind]

type Registry = { [K in NodeKind]: NodeDefinition<K> }

export const nodeRegistry: Registry = {
  start: {
    kind: 'start',
    label: 'Start',
    description: 'Workflow entry point',
    icon: Play,
    color: { chip: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-400/70', hex: '#10b981' },
    maxIncoming: 0,
    maxOutgoing: null,
    maxInstances: 1,
    createDefaultData: () => ({ title: 'Start', metadata: [] }),
    subtitle: (data) =>
      data.metadata.length > 0 ? `${data.metadata.length} metadata field(s)` : 'Entry point',
    validate: (data) => (data.title.trim() ? [] : ['Start title is required']),
  },
  task: {
    kind: 'task',
    label: 'Task',
    description: 'Human task, e.g. collect documents',
    icon: ClipboardList,
    color: { chip: 'bg-blue-100 text-blue-600', ring: 'ring-blue-400/70', hex: '#3b82f6' },
    maxIncoming: null,
    maxOutgoing: null,
    maxInstances: null,
    createDefaultData: () => ({
      title: '',
      description: '',
      assignee: '',
      dueDate: '',
      customFields: [],
    }),
    subtitle: (data) => (data.assignee.trim() ? `Assigned to ${data.assignee}` : 'Unassigned task'),
    validate: (data) => (data.title.trim() ? [] : ['Title is required']),
  },
  approval: {
    kind: 'approval',
    label: 'Approval',
    description: 'Manager or HR approval step',
    icon: UserCheck,
    color: { chip: 'bg-amber-100 text-amber-600', ring: 'ring-amber-400/70', hex: '#f59e0b' },
    maxIncoming: null,
    maxOutgoing: null,
    maxInstances: null,
    createDefaultData: () => ({ title: 'Approval', approverRole: 'Manager', autoApproveThreshold: 0 }),
    subtitle: (data) => `${data.approverRole} · auto-approve ≤ ${data.autoApproveThreshold}`,
    validate: (data) => {
      const issues: string[] = []
      if (!data.title.trim()) issues.push('Title is required')
      if (data.autoApproveThreshold < 0) issues.push('Auto-approve threshold cannot be negative')
      return issues
    },
  },
  automated: {
    kind: 'automated',
    label: 'Automated Step',
    description: 'System action, e.g. send email',
    icon: Zap,
    color: { chip: 'bg-violet-100 text-violet-600', ring: 'ring-violet-400/70', hex: '#8b5cf6' },
    maxIncoming: null,
    maxOutgoing: null,
    maxInstances: null,
    createDefaultData: () => ({ title: '', actionId: null, actionLabel: null, params: {} }),
    subtitle: (data) => data.actionLabel ?? 'No action selected',
    validate: (data) => {
      const issues: string[] = []
      if (!data.title.trim()) issues.push('Title is required')
      if (!data.actionId) issues.push('An action must be selected')
      return issues
    },
  },
  end: {
    kind: 'end',
    label: 'End',
    description: 'Workflow completion',
    icon: CheckCircle2,
    color: { chip: 'bg-rose-100 text-rose-600', ring: 'ring-rose-400/70', hex: '#f43f5e' },
    maxIncoming: null,
    maxOutgoing: 0,
    maxInstances: null,
    createDefaultData: () => ({ endMessage: 'Workflow completed', includeSummary: true }),
    subtitle: () => 'Workflow ends here',
    validate: (data) => (data.endMessage.trim() ? [] : ['End message is required']),
  },
}

export function getNodeDef<K extends NodeKind>(kind: K): NodeDefinition<K> {
  return nodeRegistry[kind]
}

export function listNodeDefs(): AnyNodeDefinition[] {
  return Object.values(nodeRegistry)
}

/** Validate a node's data through its registry definition (accepts the union). */
export function validateNodeData(kind: NodeKind, data: NodeDataOf[NodeKind]): string[] {
  // The registry entry for `kind` always matches the data stored under that kind; the
  // cast re-associates the union members the type system cannot correlate on its own.
  return (nodeRegistry[kind].validate as (d: NodeDataOf[NodeKind]) => string[])(data)
}

/** Subtitle for a node's data through its registry definition (accepts the union). */
export function nodeSubtitle(kind: NodeKind, data: NodeDataOf[NodeKind]): string {
  return (nodeRegistry[kind].subtitle as (d: NodeDataOf[NodeKind]) => string)(data)
}
