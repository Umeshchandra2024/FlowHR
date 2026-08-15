import { validateNodeData } from '../registry/nodeRegistry'
import type { ValidationIssue, WorkflowEdge, WorkflowNode } from '../types'

function titleOf(node: WorkflowNode): string {
  if ('title' in node.data && node.data.title.trim()) return node.data.title
  return node.type
}

/**
 * Structural + data validation for the whole graph. Pure and framework-free so it
 * runs identically in the toolbar status chip, the sandbox gate, and unit tests.
 */
export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (nodes.length === 0) {
    return [{ id: 'empty', level: 'error', message: 'The canvas is empty — add a Start node' }]
  }

  const startNodes = nodes.filter((n) => n.type === 'start')
  if (startNodes.length === 0) {
    issues.push({ id: 'no-start', level: 'error', message: 'Workflow needs a Start node' })
  } else if (startNodes.length > 1) {
    issues.push({ id: 'multi-start', level: 'error', message: 'Only one Start node is allowed' })
  }

  if (!nodes.some((n) => n.type === 'end')) {
    issues.push({ id: 'no-end', level: 'error', message: 'Workflow needs at least one End node' })
  }

  const outgoing = new Map<string, string[]>()
  const incomingCount = new Map<string, number>()
  for (const edge of edges) {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target])
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1)
  }

  // Orphans + dead ends
  for (const node of nodes) {
    const hasOut = (outgoing.get(node.id) ?? []).length > 0
    const hasIn = (incomingCount.get(node.id) ?? 0) > 0
    if (!hasOut && !hasIn && nodes.length > 1) {
      issues.push({
        id: `orphan:${node.id}`,
        level: 'error',
        nodeId: node.id,
        message: `'${titleOf(node)}' is not connected to anything`,
      })
    } else if (!hasOut && node.type !== 'end') {
      issues.push({
        id: `dead-end:${node.id}`,
        level: 'warning',
        nodeId: node.id,
        message: `'${titleOf(node)}' is a dead end — no path continues from it`,
      })
    }
  }

  // Reachability from Start (BFS)
  const start = startNodes[0]
  if (start) {
    const reachable = new Set<string>([start.id])
    const queue = [start.id]
    while (queue.length > 0) {
      for (const target of outgoing.get(queue.shift()!) ?? []) {
        if (!reachable.has(target)) {
          reachable.add(target)
          queue.push(target)
        }
      }
    }
    for (const node of nodes) {
      const isOrphan = issues.some((i) => i.id === `orphan:${node.id}`)
      if (!reachable.has(node.id) && !isOrphan) {
        issues.push({
          id: `unreachable:${node.id}`,
          level: 'error',
          nodeId: node.id,
          message: `'${titleOf(node)}' can never run — there is no path from Start`,
        })
      }
    }
  }

  // Cycle detection (DFS, white/gray/black)
  const cycle = findCycle(nodes, outgoing)
  if (cycle) {
    const names = cycle.map((id) => {
      const node = nodes.find((n) => n.id === id)
      return node ? `'${titleOf(node)}'` : id
    })
    issues.push({
      id: 'cycle',
      level: 'error',
      nodeId: cycle[0],
      message: `Cycle detected: ${names.join(' → ')} — workflows must not loop`,
    })
  }

  // Per-node data validation via the registry
  for (const node of nodes) {
    for (const problem of validateNodeData(node.type, node.data)) {
      issues.push({
        id: `data:${node.id}:${problem}`,
        level: 'error',
        nodeId: node.id,
        message: `'${titleOf(node)}': ${problem}`,
      })
    }
  }

  return issues.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))
}

/** Returns the node ids forming a cycle (closed: first id repeated last), or null. */
function findCycle(nodes: WorkflowNode[], outgoing: Map<string, string[]>): string[] | null {
  const state = new Map<string, 'visiting' | 'done'>()
  const stack: string[] = []

  const visit = (id: string): string[] | null => {
    state.set(id, 'visiting')
    stack.push(id)
    for (const target of outgoing.get(id) ?? []) {
      const targetState = state.get(target)
      if (targetState === 'visiting') {
        return [...stack.slice(stack.indexOf(target)), target]
      }
      if (targetState === undefined) {
        const found = visit(target)
        if (found) return found
      }
    }
    stack.pop()
    state.set(id, 'done')
    return null
  }

  for (const node of nodes) {
    if (!state.has(node.id)) {
      const found = visit(node.id)
      if (found) return found
    }
  }
  return null
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === 'error')
}
