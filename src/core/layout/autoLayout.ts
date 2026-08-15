import dagre from 'dagre'
import type { WorkflowEdge, WorkflowNode } from '../types'

// Matches the rendered card size closely enough for clean rank spacing.
const NODE_WIDTH = 240
const NODE_HEIGHT = 96

/** Top-to-bottom dagre layout; returns nodes with new positions (pure). */
export function autoLayout(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 60 })
  graph.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  for (const edge of edges) graph.setEdge(edge.source, edge.target)

  dagre.layout(graph)

  return nodes.map((node) => {
    const placed = graph.node(node.id)
    return {
      ...node,
      position: { x: placed.x - NODE_WIDTH / 2, y: placed.y - NODE_HEIGHT / 2 },
    } as WorkflowNode
  })
}
