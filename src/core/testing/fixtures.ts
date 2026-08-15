import { getNodeDef } from '../registry/nodeRegistry'
import type { NodeDataOf, NodeKind, WorkflowEdge, WorkflowNode } from '../types'

/** Build a live node from registry defaults plus overrides (test helper). */
export function makeNode<K extends NodeKind>(
  kind: K,
  id: string,
  data: Partial<NodeDataOf[K]> = {},
): WorkflowNode {
  // The open generic K keeps callers' overrides typed per-kind, but stops TS from
  // relating the literal to the union — reassociate through unknown (test-only helper).
  return {
    id,
    type: kind,
    position: { x: 0, y: 0 },
    data: { ...getNodeDef(kind).createDefaultData(), ...data },
  } as unknown as WorkflowNode
}

export function makeEdge(source: string, target: string): WorkflowEdge {
  return { id: `${source}->${target}`, source, target }
}

/** A minimal valid graph: start -> task -> end. */
export function validLinearGraph(): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  return {
    nodes: [
      makeNode('start', 's1'),
      makeNode('task', 't1', { title: 'Collect documents', assignee: 'hr@acme.com' }),
      makeNode('end', 'e1'),
    ],
    edges: [makeEdge('s1', 't1'), makeEdge('t1', 'e1')],
  }
}
