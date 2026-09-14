import { describe, expect, it } from 'vitest';
import { validateWorkflow, isWorkflowValid } from '../../src/domain/graph/validate';
import type { SerializedEdge, SerializedNode } from '../../src/domain/types';

function start(id: string, overrides: Partial<SerializedNode> = {}): SerializedNode {
  return {
    id,
    kind: 'start',
    position: { x: 0, y: 0 },
    data: { title: 'Start', metadata: [] },
    ...overrides,
  } as SerializedNode;
}

function end(id: string, overrides: Partial<SerializedNode> = {}): SerializedNode {
  return {
    id,
    kind: 'end',
    position: { x: 0, y: 0 },
    data: { endMessage: 'Done', includeSummary: false },
    ...overrides,
  } as SerializedNode;
}

function task(id: string, overrides: Partial<SerializedNode> = {}): SerializedNode {
  return {
    id,
    kind: 'task',
    position: { x: 0, y: 0 },
    data: { title: 'Task', description: '', assignee: '', dueDate: '', customFields: [] },
    ...overrides,
  } as SerializedNode;
}

function edge(id: string, source: string, target: string): SerializedEdge {
  return { id, source, target };
}

describe('validateWorkflow', () => {
  it('flags an empty workflow', () => {
    const issues = validateWorkflow([], []);
    expect(issues).toEqual([{ id: 'empty', level: 'error', message: 'Workflow has no nodes' }]);
  });

  it('accepts a simple valid start -> task -> end graph', () => {
    const nodes = [start('s'), task('t'), end('e')];
    const edges = [edge('e1', 's', 't'), edge('e2', 't', 'e')];
    const issues = validateWorkflow(nodes, edges);
    expect(isWorkflowValid(issues)).toBe(true);
  });

  it('requires exactly one start node', () => {
    const noStart = validateWorkflow([task('t'), end('e')], [edge('e1', 't', 'e')]);
    expect(noStart.some((i) => i.id === 'no-start')).toBe(true);

    const twoStarts = validateWorkflow(
      [start('s1'), start('s2'), end('e')],
      [edge('e1', 's1', 'e'), edge('e2', 's2', 'e')],
    );
    expect(twoStarts.some((i) => i.id === 'multi-start')).toBe(true);
  });

  it('requires at least one end node', () => {
    const issues = validateWorkflow([start('s'), task('t')], [edge('e1', 's', 't')]);
    expect(issues.some((i) => i.id === 'no-end')).toBe(true);
  });

  it('flags nodes unreachable from start', () => {
    const nodes = [start('s'), end('e'), task('orphan-target')];
    // orphan-target has an incoming edge from nowhere reachable, so it's unreachable, not orphaned
    const edges = [edge('e1', 's', 'e'), edge('e2', 'unrelated', 'orphan-target')];
    const issues = validateWorkflow(nodes, edges);
    expect(issues.some((i) => i.id === 'unreachable:orphan-target')).toBe(true);
  });

  it('flags fully disconnected nodes as orphans, not unreachable', () => {
    const nodes = [start('s'), end('e'), task('lonely')];
    const edges = [edge('e1', 's', 'e')];
    const issues = validateWorkflow(nodes, edges);
    expect(issues.some((i) => i.id === 'orphan:lonely')).toBe(true);
    expect(issues.some((i) => i.id === 'unreachable:lonely')).toBe(false);
  });

  it('detects cycles', () => {
    const nodes = [start('s'), task('a'), task('b'), end('e')];
    const edges = [edge('e1', 's', 'a'), edge('e2', 'a', 'b'), edge('e3', 'b', 'a'), edge('e4', 'b', 'e')];
    const issues = validateWorkflow(nodes, edges);
    expect(issues.some((i) => i.id === 'cycle')).toBe(true);
  });

  it('warns on dead ends that are not end nodes', () => {
    const nodes = [start('s'), task('dangling'), end('e')];
    const edges = [edge('e1', 's', 'dangling'), edge('e2', 's', 'e')];
    const issues = validateWorkflow(nodes, edges);
    const warning = issues.find((i) => i.id === 'dead-end:dangling');
    expect(warning?.level).toBe('warning');
  });

  it('validates per-node-kind required fields', () => {
    const nodes = [
      start('s', { data: { title: '', metadata: [] } } as Partial<SerializedNode>),
      end('e', { data: { endMessage: '', includeSummary: false } } as Partial<SerializedNode>),
    ];
    const issues = validateWorkflow(nodes, [edge('e1', 's', 'e')]);
    expect(issues.some((i) => i.id === 'fields:s')).toBe(true);
    expect(issues.some((i) => i.id === 'fields:e')).toBe(true);
  });

  it('rejects an automated node with no action configured', () => {
    const automated: SerializedNode = {
      id: 'a',
      kind: 'automated',
      position: { x: 0, y: 0 },
      data: { title: 'Do thing', actionId: null, actionLabel: null, params: {} },
    };
    const nodes = [start('s'), automated, end('e')];
    const edges = [edge('e1', 's', 'a'), edge('e2', 'a', 'e')];
    const issues = validateWorkflow(nodes, edges);
    expect(issues.some((i) => i.id === 'fields:a')).toBe(true);
  });

  it('sorts errors before warnings', () => {
    const nodes = [start('s'), task('dangling'), end('e')];
    const edges = [edge('e1', 's', 'dangling'), edge('e2', 's', 'e')];
    const twoStarts = validateWorkflow([start('s1'), ...nodes], edges);
    const firstWarningIndex = twoStarts.findIndex((i) => i.level === 'warning');
    const firstErrorAfterWarning = twoStarts.slice(firstWarningIndex).some((i) => i.level === 'error');
    expect(firstErrorAfterWarning).toBe(false);
  });
});
