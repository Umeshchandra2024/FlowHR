import type { Edge, Node } from '@xyflow/react'

/** Discriminant for every workflow node type. The registry is keyed by this. */
export type NodeKind = 'start' | 'task' | 'approval' | 'automated' | 'end'

export const NODE_KINDS: readonly NodeKind[] = ['start', 'task', 'approval', 'automated', 'end']

export type KeyValue = {
  id: string
  key: string
  value: string
}

export type ApproverRole = 'Manager' | 'HRBP' | 'Director'

export const APPROVER_ROLES: readonly ApproverRole[] = ['Manager', 'HRBP', 'Director']

export type StartNodeData = {
  title: string
  metadata: KeyValue[]
}

export type TaskNodeData = {
  title: string
  description: string
  assignee: string
  dueDate: string
  customFields: KeyValue[]
}

export type ApprovalNodeData = {
  title: string
  approverRole: ApproverRole
  autoApproveThreshold: number
}

export type AutomatedNodeData = {
  title: string
  actionId: string | null
  /** Denormalized label of the chosen action so canvas + simulation can render it without an API lookup. */
  actionLabel: string | null
  params: Record<string, string>
}

export type EndNodeData = {
  endMessage: string
  includeSummary: boolean
}

/** Map from node kind to its data shape — the source of truth for narrowing. */
export type NodeDataOf = {
  start: StartNodeData
  task: TaskNodeData
  approval: ApprovalNodeData
  automated: AutomatedNodeData
  end: EndNodeData
}

export type NodeData = NodeDataOf[NodeKind]

/** Discriminated union of React Flow nodes — narrowing on `type` narrows `data`. */
export type WorkflowNode = { [K in NodeKind]: Node<NodeDataOf[K], K> }[NodeKind]

export type WorkflowEdge = Edge

/** Mock automation action exposed by GET /automations. */
export type AutomationAction = {
  id: string
  label: string
  params: string[]
}

export type SimulationStepStatus = 'success' | 'skipped' | 'error'

export type SimulationStep = {
  /** Order of execution, 1-based. */
  index: number
  nodeId: string
  nodeKind: NodeKind
  nodeLabel: string
  /** Edge traversed to reach this node (absent for the start node). */
  viaEdgeId?: string
  status: SimulationStepStatus
  message: string
  durationMs: number
}

export type SimulationResult = {
  workflowName: string
  status: 'completed' | 'failed'
  totalSteps: number
  totalDurationMs: number
  steps: SimulationStep[]
}

export type ValidationLevel = 'error' | 'warning'

export type ValidationIssue = {
  id: string
  level: ValidationLevel
  message: string
  /** Present when the issue is attributable to a specific node. */
  nodeId?: string
}

/** Versioned serialized workflow — the payload for export, import, and POST /simulate. */
export type SerializedNode = {
  id: string
  kind: NodeKind
  position: { x: number; y: number }
  data: NodeData
}

export type SerializedEdge = {
  id: string
  source: string
  target: string
}

export type WorkflowJSON = {
  version: 1
  name: string
  nodes: SerializedNode[]
  edges: SerializedEdge[]
}
