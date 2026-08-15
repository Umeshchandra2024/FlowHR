import type {
  NodeData,
  SerializedNode,
  SimulationResult,
  SimulationStep,
  WorkflowJSON,
} from '../types'

/**
 * Mock execution engine — a pure function so it is unit-testable and could move
 * to a real backend unchanged. The MSW /simulate handler is just a thin wrapper
 * around it. Walks the graph breadth-first from the Start node, following all
 * outgoing edges (parallel branches execute in discovery order).
 *
 * Randomness is injected so tests can pass a deterministic `rng`.
 */
export function simulateWorkflow(
  workflow: WorkflowJSON,
  rng: () => number = Math.random,
): SimulationResult {
  const startNode = workflow.nodes.find((n) => n.kind === 'start')
  if (!startNode) {
    return {
      workflowName: workflow.name,
      status: 'failed',
      totalSteps: 0,
      totalDurationMs: 0,
      steps: [],
    }
  }

  const nodesById = new Map(workflow.nodes.map((n) => [n.id, n]))
  const steps: SimulationStep[] = []
  const visited = new Set<string>([startNode.id])
  const queue: Array<{ nodeId: string; viaEdgeId?: string }> = [{ nodeId: startNode.id }]
  let failed = false

  while (queue.length > 0) {
    const { nodeId, viaEdgeId } = queue.shift()!
    const node = nodesById.get(nodeId)
    if (!node) continue

    const { status, message } = describeStep(node, steps.length, rng)
    if (status === 'error') failed = true

    steps.push({
      index: steps.length + 1,
      nodeId: node.id,
      nodeKind: node.kind,
      nodeLabel: nodeTitle(node),
      viaEdgeId,
      status,
      message,
      durationMs: 150 + Math.floor(rng() * 650),
    })

    for (const edge of workflow.edges) {
      if (edge.source !== nodeId || visited.has(edge.target)) continue
      visited.add(edge.target)
      queue.push({ nodeId: edge.target, viaEdgeId: edge.id })
    }
  }

  return {
    workflowName: workflow.name,
    status: failed ? 'failed' : 'completed',
    totalSteps: steps.length,
    totalDurationMs: steps.reduce((sum, s) => sum + s.durationMs, 0),
    steps,
  }
}

function nodeTitle(node: SerializedNode): string {
  const data = node.data as NodeData
  if ('title' in data && data.title.trim()) return data.title
  return node.kind === 'end' ? 'End' : node.kind
}

function describeStep(
  node: SerializedNode,
  executedSoFar: number,
  rng: () => number,
): { status: SimulationStep['status']; message: string } {
  const data = node.data
  switch (node.kind) {
    case 'start': {
      if (!('metadata' in data)) break
      const meta =
        data.metadata.length > 0
          ? ` with metadata ${data.metadata.map((m) => `${m.key}=${m.value}`).join(', ')}`
          : ''
      return { status: 'success', message: `Workflow '${data.title}' started${meta}` }
    }
    case 'task': {
      if (!('assignee' in data)) break
      const assignee = data.assignee.trim() || 'unassigned'
      const due = data.dueDate ? ` (due ${data.dueDate})` : ''
      return { status: 'success', message: `Task '${data.title}' assigned to ${assignee}${due}` }
    }
    case 'approval': {
      if (!('approverRole' in data)) break
      const autoApproved = data.autoApproveThreshold > 0 && rng() < 0.4
      const outcome = autoApproved
        ? `auto-approved (≤ ${data.autoApproveThreshold})`
        : `approved by ${data.approverRole}`
      return {
        status: 'success',
        message: `Approval '${data.title}' routed to ${data.approverRole} — ${outcome}`,
      }
    }
    case 'automated': {
      if (!('actionId' in data)) break
      if (!data.actionId) {
        return { status: 'error', message: `Automated step '${data.title || 'untitled'}' has no action configured` }
      }
      const params = Object.entries(data.params)
        .map(([k, v]) => `${k}="${v || '—'}"`)
        .join(', ')
      return {
        status: 'success',
        message: `Executed '${data.actionLabel ?? data.actionId}'${params ? ` with ${params}` : ''}`,
      }
    }
    case 'end': {
      if (!('endMessage' in data)) break
      const summary = data.includeSummary ? ` — summary: ${executedSoFar} step(s) executed before completion` : ''
      return { status: 'success', message: `Workflow completed: ${data.endMessage}${summary}` }
    }
  }
  return { status: 'skipped', message: `Skipped malformed ${node.kind} node` }
}
