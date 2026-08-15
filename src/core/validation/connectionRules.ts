import { getNodeDef } from '../registry/nodeRegistry'
import type { WorkflowEdge, WorkflowNode } from '../types'

export type ConnectionLike = {
  source: string | null
  target: string | null
}

/**
 * Pure connection gate used by React Flow's `isValidConnection`.
 * Enforces registry cardinality (Start accepts no incoming, End emits no outgoing),
 * and rejects self-loops and duplicate edges.
 */
export function canConnect(
  connection: ConnectionLike,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): boolean {
  const { source, target } = connection
  if (!source || !target || source === target) return false

  const sourceNode = nodes.find((n) => n.id === source)
  const targetNode = nodes.find((n) => n.id === target)
  if (!sourceNode || !targetNode) return false

  if (edges.some((e) => e.source === source && e.target === target)) return false

  const sourceDef = getNodeDef(sourceNode.type)
  if (sourceDef.maxOutgoing !== null) {
    const outgoing = edges.filter((e) => e.source === source).length
    if (outgoing >= sourceDef.maxOutgoing) return false
  }

  const targetDef = getNodeDef(targetNode.type)
  if (targetDef.maxIncoming !== null) {
    const incoming = edges.filter((e) => e.target === target).length
    if (incoming >= targetDef.maxIncoming) return false
  }

  return true
}
