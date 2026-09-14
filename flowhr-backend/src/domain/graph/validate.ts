import type { SerializedNode, SerializedEdge, ValidationIssue, NodeData } from '../types';

// Re-derives the frontend's client-side validation (src/core/validation/graphValidation.ts)
// server-side. The API must never trust a client-computed "this graph is valid" flag, since a
// malicious or buggy client could send a graph that was never actually checked.

function nodeLabel(node: SerializedNode): string {
  const title = (node.data as { title?: string }).title;
  if (typeof title === 'string' && title.trim().length > 0) return title;
  if (node.kind === 'end') return 'End';
  return node.kind;
}

function validateNodeFields(node: SerializedNode): string | null {
  const data = node.data as Record<string, unknown> & NodeData;
  switch (node.kind) {
    case 'start':
      if (!('title' in data) || !String((data as { title: string }).title ?? '').trim()) {
        return `Start node "${nodeLabel(node)}" requires a title`;
      }
      return null;
    case 'task':
      if (!String((data as { title: string }).title ?? '').trim()) {
        return `Task node "${nodeLabel(node)}" requires a title`;
      }
      return null;
    case 'approval': {
      const d = data as { title: string; autoApproveThreshold: number };
      if (!String(d.title ?? '').trim()) {
        return `Approval node "${nodeLabel(node)}" requires a title`;
      }
      if (typeof d.autoApproveThreshold !== 'number' || Number.isNaN(d.autoApproveThreshold) || d.autoApproveThreshold < 0) {
        return `Approval node "${nodeLabel(node)}" requires a non-negative auto-approve threshold`;
      }
      return null;
    }
    case 'automated': {
      const d = data as { title: string; actionId: string | null };
      if (!String(d.title ?? '').trim()) {
        return `Automated node "${nodeLabel(node)}" requires a title`;
      }
      if (!d.actionId) {
        return `Automated node "${nodeLabel(node)}" requires a configured action`;
      }
      return null;
    }
    case 'end': {
      const d = data as { endMessage: string };
      if (!String(d.endMessage ?? '').trim()) {
        return `End node "${nodeLabel(node)}" requires an end message`;
      }
      return null;
    }
    default:
      return `Node "${node.id}" has an unknown kind`;
  }
}

export function validateWorkflow(nodes: SerializedNode[], edges: SerializedEdge[]): ValidationIssue[] {
  if (nodes.length === 0) {
    return [{ id: 'empty', level: 'error', message: 'Workflow has no nodes' }];
  }

  const issues: ValidationIssue[] = [];

  const startNodes = nodes.filter((n) => n.kind === 'start');
  if (startNodes.length === 0) {
    issues.push({ id: 'no-start', level: 'error', message: 'Workflow must have a Start node' });
  } else if (startNodes.length > 1) {
    issues.push({ id: 'multi-start', level: 'error', message: 'Workflow must have exactly one Start node' });
  }

  if (!nodes.some((n) => n.kind === 'end')) {
    issues.push({ id: 'no-end', level: 'error', message: 'Workflow must have at least one End node' });
  }

  const incoming = new Map<string, SerializedEdge[]>();
  const outgoing = new Map<string, SerializedEdge[]>();
  for (const node of nodes) {
    incoming.set(node.id, []);
    outgoing.set(node.id, []);
  }
  for (const edge of edges) {
    outgoing.get(edge.source)?.push(edge);
    incoming.get(edge.target)?.push(edge);
  }

  const isOrphan = (nodeId: string) =>
    (incoming.get(nodeId)?.length ?? 0) === 0 && (outgoing.get(nodeId)?.length ?? 0) === 0;

  if (nodes.length > 1) {
    for (const node of nodes) {
      if (isOrphan(node.id)) {
        issues.push({
          id: `orphan:${node.id}`,
          level: 'error',
          message: `Node "${nodeLabel(node)}" is disconnected from the rest of the workflow`,
          nodeId: node.id,
        });
      }
    }
  }

  for (const node of nodes) {
    const hasOut = (outgoing.get(node.id)?.length ?? 0) > 0;
    if (!hasOut && node.kind !== 'end') {
      issues.push({
        id: `dead-end:${node.id}`,
        level: 'warning',
        message: `Node "${nodeLabel(node)}" has no outgoing path`,
        nodeId: node.id,
      });
    }
  }

  if (startNodes.length === 1) {
    const start = startNodes[0];
    const reachable = new Set<string>([start.id]);
    const queue = [start.id];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const edge of outgoing.get(current) ?? []) {
        if (!reachable.has(edge.target)) {
          reachable.add(edge.target);
          queue.push(edge.target);
        }
      }
    }
    for (const node of nodes) {
      if (!reachable.has(node.id) && !isOrphan(node.id)) {
        issues.push({
          id: `unreachable:${node.id}`,
          level: 'error',
          message: `Node "${nodeLabel(node)}" is not reachable from Start`,
          nodeId: node.id,
        });
      }
    }
  }

  const color = new Map<string, 0 | 1 | 2>();
  for (const node of nodes) color.set(node.id, 0);
  let cyclePath: string[] | null = null;

  const dfs = (nodeId: string, path: string[]): boolean => {
    color.set(nodeId, 1);
    path.push(nodeId);
    for (const edge of outgoing.get(nodeId) ?? []) {
      const targetColor = color.get(edge.target);
      if (targetColor === 1) {
        const cycleStart = path.indexOf(edge.target);
        cyclePath = path.slice(cycleStart).concat(edge.target);
        return true;
      }
      if (targetColor === 0 && dfs(edge.target, path)) {
        return true;
      }
    }
    path.pop();
    color.set(nodeId, 2);
    return false;
  };

  for (const node of nodes) {
    if (color.get(node.id) === 0 && dfs(node.id, [])) break;
  }

  if (cyclePath) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const titles = (cyclePath as string[]).map((id) => {
      const n = byId.get(id);
      return n ? nodeLabel(n) : id;
    });
    issues.push({ id: 'cycle', level: 'error', message: `Workflow contains a cycle: ${titles.join(' → ')}` });
  }

  for (const node of nodes) {
    const fieldError = validateNodeFields(node);
    if (fieldError) {
      issues.push({ id: `fields:${node.id}`, level: 'error', message: fieldError, nodeId: node.id });
    }
  }

  return issues.sort((a, b) => {
    if (a.level === b.level) return 0;
    return a.level === 'error' ? -1 : 1;
  });
}

export function isWorkflowValid(issues: ValidationIssue[]): boolean {
  return !issues.some((issue) => issue.level === 'error');
}
