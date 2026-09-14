import type {
  WorkflowJSON,
  SerializedNode,
  SimulationResult,
  SimulationStep,
  SimulationStepStatus,
  AutomationExecutor,
  StartNodeData,
  TaskNodeData,
  ApprovalNodeData,
  AutomatedNodeData,
  EndNodeData,
} from '../types';

export type RunWorkflowDeps = {
  automationExecutors: Record<string, AutomationExecutor>;
  /** Injectable for deterministic tests; defaults to a random 150-799ms span like the frontend mock. */
  randomDurationMs?: () => number;
};

function nodeLabel(node: SerializedNode): string {
  const title = (node.data as { title?: string }).title;
  if (typeof title === 'string' && title.trim().length > 0) return title;
  if (node.kind === 'end') return 'End';
  return node.kind;
}

async function describeStep(
  node: SerializedNode,
  stepsExecutedBefore: number,
  deps: RunWorkflowDeps,
): Promise<{ status: SimulationStepStatus; message: string }> {
  switch (node.kind) {
    case 'start': {
      const data = node.data as StartNodeData;
      const metaStr = data.metadata?.length
        ? ' with metadata ' + data.metadata.map((m) => `${m.key}=${m.value}`).join(', ')
        : '';
      return { status: 'success', message: `Workflow '${data.title}' started${metaStr}` };
    }
    case 'task': {
      const data = node.data as TaskNodeData;
      const due = data.dueDate ? ` (due ${data.dueDate})` : '';
      return {
        status: 'success',
        message: `Task '${data.title}' assigned to ${data.assignee || 'unassigned'}${due}`,
      };
    }
    case 'approval': {
      const data = node.data as ApprovalNodeData;
      const outcome =
        data.autoApproveThreshold > 0
          ? `auto-approved (≤ ${data.autoApproveThreshold})`
          : `pending approval by ${data.approverRole}`;
      return {
        status: 'success',
        message: `Approval '${data.title}' routed to ${data.approverRole} — ${outcome}`,
      };
    }
    case 'automated': {
      const data = node.data as AutomatedNodeData;
      if (!data.actionId) {
        return { status: 'error', message: `Automated step '${data.title || 'untitled'}' has no action configured` };
      }
      const executor = deps.automationExecutors[data.actionId];
      if (!executor) {
        return {
          status: 'error',
          message: `Automated step '${data.title}' references unknown action '${data.actionId}'`,
        };
      }
      return executor({
        nodeTitle: data.title,
        actionLabel: data.actionLabel ?? data.actionId,
        params: data.params ?? {},
      });
    }
    case 'end': {
      const data = node.data as EndNodeData;
      const summary = data.includeSummary
        ? ` — summary: ${stepsExecutedBefore} step(s) executed before completion`
        : '';
      return { status: 'success', message: `Workflow completed: ${data.endMessage}${summary}` };
    }
    default:
      return { status: 'skipped', message: `Skipped malformed ${node.kind} node` };
  }
}

const defaultRandomDuration = () => 150 + Math.floor(Math.random() * 650);

// Walks the graph breadth-first from the single Start node (mirroring the frontend's mock
// simulation engine's traversal order exactly, so step ordering looks identical to users who are
// used to the old client-only simulation), executing automated actions for real via the injected
// executors and logging every other node kind as a recorded, non-fabricated step.
export async function runWorkflow(workflow: WorkflowJSON, deps: RunWorkflowDeps): Promise<SimulationResult> {
  const randomDuration = deps.randomDurationMs ?? defaultRandomDuration;
  const byId = new Map(workflow.nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, WorkflowJSON['edges']>();
  for (const node of workflow.nodes) outgoing.set(node.id, []);
  for (const edge of workflow.edges) outgoing.get(edge.source)?.push(edge);

  const start = workflow.nodes.find((n) => n.kind === 'start');
  if (!start) {
    return { workflowName: workflow.name, status: 'failed', totalSteps: 0, totalDurationMs: 0, steps: [] };
  }

  const steps: SimulationStep[] = [];
  const visited = new Set<string>([start.id]);
  const queue: { node: SerializedNode; viaEdgeId?: string }[] = [{ node: start }];

  let index = 1;
  while (queue.length > 0) {
    const { node, viaEdgeId } = queue.shift() as { node: SerializedNode; viaEdgeId?: string };
    const { status, message } = await describeStep(node, steps.length, deps);
    steps.push({
      index: index++,
      nodeId: node.id,
      nodeKind: node.kind,
      nodeLabel: nodeLabel(node),
      viaEdgeId,
      status,
      message,
      durationMs: randomDuration(),
    });

    for (const edge of outgoing.get(node.id) ?? []) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        const target = byId.get(edge.target);
        if (target) queue.push({ node: target, viaEdgeId: edge.id });
      }
    }
  }

  const totalDurationMs = steps.reduce((sum, s) => sum + s.durationMs, 0);
  const status: SimulationResult['status'] = steps.some((s) => s.status === 'error') ? 'failed' : 'completed';

  return {
    workflowName: workflow.name,
    status,
    totalSteps: steps.length,
    totalDurationMs,
    steps,
  };
}
