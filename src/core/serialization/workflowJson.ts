import { MarkerType } from '@xyflow/react'
import { getNodeDef } from '../registry/nodeRegistry'
import type {
  NodeData,
  NodeKind,
  SerializedEdge,
  SerializedNode,
  WorkflowEdge,
  WorkflowJSON,
  WorkflowNode,
} from '../types'
import { NODE_KINDS } from '../types'

/** Serialize the live graph into the versioned payload used by export and /simulate. */
export function toWorkflowJSON(
  name: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): WorkflowJSON {
  return {
    version: 1,
    name,
    nodes: nodes.map((n) => ({ id: n.id, kind: n.type, position: n.position, data: n.data })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  }
}

/** Rebuild a styled React Flow edge from its serialized form. */
export function buildStyledEdge(
  edge: SerializedEdge,
  sourceKind: NodeKind | undefined,
): WorkflowEdge {
  const hex = sourceKind ? getNodeDef(sourceKind).color.hex : '#94a3b8'
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    style: { stroke: hex },
    markerEnd: { type: MarkerType.ArrowClosed, color: hex, width: 18, height: 18 },
  }
}

/** Hydrate a parsed payload back into live React Flow nodes and edges. */
export function toGraph(json: WorkflowJSON): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const nodes = json.nodes.map(
    (n) => ({ id: n.id, type: n.kind, position: n.position, data: n.data }) as WorkflowNode,
  )
  const kindById = new Map(json.nodes.map((n) => [n.id, n.kind]))
  const edges = json.edges.map((e) => buildStyledEdge(e, kindById.get(e.source)))
  return { nodes, edges }
}

export type ParseResult = { ok: true; value: WorkflowJSON } | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNodeKind(value: unknown): value is NodeKind {
  return typeof value === 'string' && (NODE_KINDS as readonly string[]).includes(value)
}

/**
 * Structural validation for imported files. Unknown data fields are preserved-then-
 * defaulted: each node's data is layered over its kind's registry defaults, so a
 * payload from an older/partial export still hydrates into a usable graph.
 */
export function fromWorkflowJSON(raw: unknown): ParseResult {
  if (!isRecord(raw)) return { ok: false, error: 'File is not a JSON object' }
  if (raw.version !== 1) return { ok: false, error: `Unsupported version: ${String(raw.version)}` }
  if (typeof raw.name !== 'string') return { ok: false, error: 'Missing workflow name' }
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
    return { ok: false, error: 'Payload must contain nodes[] and edges[]' }
  }

  const nodes: SerializedNode[] = []
  for (const entry of raw.nodes as unknown[]) {
    if (!isRecord(entry)) return { ok: false, error: 'Invalid node entry' }
    const { id, kind, position, data } = entry
    if (typeof id !== 'string' || !id) return { ok: false, error: 'Node is missing an id' }
    if (!isNodeKind(kind)) return { ok: false, error: `Unknown node kind: ${String(kind)}` }
    if (
      !isRecord(position) ||
      typeof position.x !== 'number' ||
      typeof position.y !== 'number' ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y)
    ) {
      return { ok: false, error: `Node '${id}' has an invalid position` }
    }
    if (!isRecord(data)) return { ok: false, error: `Node '${id}' has invalid data` }
    const merged = { ...getNodeDef(kind).createDefaultData(), ...data } as NodeData
    nodes.push({ id, kind, position: { x: position.x, y: position.y }, data: merged })
  }

  const nodeIds = new Set(nodes.map((n) => n.id))
  const edges: SerializedEdge[] = []
  for (const entry of raw.edges as unknown[]) {
    if (!isRecord(entry)) return { ok: false, error: 'Invalid edge entry' }
    const { id, source, target } = entry
    if (typeof id !== 'string' || typeof source !== 'string' || typeof target !== 'string') {
      return { ok: false, error: 'Edge is missing id/source/target' }
    }
    if (!nodeIds.has(source) || !nodeIds.has(target)) {
      return { ok: false, error: `Edge '${id}' references a node that does not exist` }
    }
    edges.push({ id, source, target })
  }

  return { ok: true, value: { version: 1, name: raw.name, nodes, edges } }
}
