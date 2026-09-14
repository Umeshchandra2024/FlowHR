import { describe, expect, it, vi } from 'vitest';
import { runWorkflow } from '../../src/domain/execution/engine';
import type { AutomationExecutor, WorkflowJSON } from '../../src/domain/types';

const fixedDuration = () => 100;

function baseExecutors(): Record<string, AutomationExecutor> {
  return {
    send_email: vi.fn(async () => ({ status: 'success' as const, message: 'Executed send_email' })),
    slack_notify: vi.fn(async () => ({ status: 'success' as const, message: 'Executed slack_notify' })),
  };
}

const linearWorkflow: WorkflowJSON = {
  version: 1,
  name: 'Onboarding',
  nodes: [
    { id: 's', kind: 'start', position: { x: 0, y: 0 }, data: { title: 'Kickoff', metadata: [] } },
    {
      id: 't',
      kind: 'task',
      position: { x: 0, y: 0 },
      data: { title: 'Prepare desk', description: '', assignee: 'ops@acme.com', dueDate: '', customFields: [] },
    },
    {
      id: 'a',
      kind: 'approval',
      position: { x: 0, y: 0 },
      data: { title: 'Manager sign-off', approverRole: 'Manager', autoApproveThreshold: 0 },
    },
    {
      id: 'auto',
      kind: 'automated',
      position: { x: 0, y: 0 },
      data: { title: 'Notify', actionId: 'slack_notify', actionLabel: 'Notify on Slack', params: { channel: '#hr' } },
    },
    { id: 'e', kind: 'end', position: { x: 0, y: 0 }, data: { endMessage: 'Done', includeSummary: true } },
  ],
  edges: [
    { id: 'e1', source: 's', target: 't' },
    { id: 'e2', source: 't', target: 'a' },
    { id: 'e3', source: 'a', target: 'auto' },
    { id: 'e4', source: 'auto', target: 'e' },
  ],
};

describe('runWorkflow', () => {
  it('walks a linear graph from start to end in order', async () => {
    const result = await runWorkflow(linearWorkflow, {
      automationExecutors: baseExecutors(),
      randomDurationMs: fixedDuration,
    });

    expect(result.status).toBe('completed');
    expect(result.steps.map((s) => s.nodeId)).toEqual(['s', 't', 'a', 'auto', 'e']);
    expect(result.totalSteps).toBe(5);
    expect(result.totalDurationMs).toBe(500);
  });

  it('marks the run failed if any automated step errors', async () => {
    const failingWorkflow: WorkflowJSON = {
      ...linearWorkflow,
      nodes: linearWorkflow.nodes.map((n) =>
        n.id === 'auto' ? { ...n, data: { ...n.data, actionId: null } as never } : n,
      ),
    };

    const result = await runWorkflow(failingWorkflow, {
      automationExecutors: baseExecutors(),
      randomDurationMs: fixedDuration,
    });

    expect(result.status).toBe('failed');
    const autoStep = result.steps.find((s) => s.nodeId === 'auto');
    expect(autoStep?.status).toBe('error');
  });

  it('invokes the injected executor for the configured action, not any other action', async () => {
    const executors = baseExecutors();
    await runWorkflow(linearWorkflow, { automationExecutors: executors, randomDurationMs: fixedDuration });

    expect(executors.slack_notify).toHaveBeenCalledWith(
      expect.objectContaining({ params: { channel: '#hr' }, actionLabel: 'Notify on Slack' }),
    );
    expect(executors.send_email).not.toHaveBeenCalled();
  });

  it('returns a failed empty result when there is no start node', async () => {
    const noStart: WorkflowJSON = { ...linearWorkflow, nodes: linearWorkflow.nodes.filter((n) => n.kind !== 'start') };
    const result = await runWorkflow(noStart, { automationExecutors: baseExecutors() });
    expect(result).toEqual({
      workflowName: 'Onboarding',
      status: 'failed',
      totalSteps: 0,
      totalDurationMs: 0,
      steps: [],
    });
  });

  it('does not revisit a node reachable via two branches (diamond graph)', async () => {
    const diamond: WorkflowJSON = {
      version: 1,
      name: 'Diamond',
      nodes: [
        { id: 's', kind: 'start', position: { x: 0, y: 0 }, data: { title: 'S', metadata: [] } },
        {
          id: 'a',
          kind: 'automated',
          position: { x: 0, y: 0 },
          data: { title: 'A', actionId: 'slack_notify', actionLabel: 'Slack', params: {} },
        },
        {
          id: 'b',
          kind: 'automated',
          position: { x: 0, y: 0 },
          data: { title: 'B', actionId: 'slack_notify', actionLabel: 'Slack', params: {} },
        },
        { id: 'e', kind: 'end', position: { x: 0, y: 0 }, data: { endMessage: 'Done', includeSummary: false } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'a' },
        { id: 'e2', source: 's', target: 'b' },
        { id: 'e3', source: 'a', target: 'e' },
        { id: 'e4', source: 'b', target: 'e' },
      ],
    };

    const result = await runWorkflow(diamond, { automationExecutors: baseExecutors(), randomDurationMs: fixedDuration });
    expect(result.steps.filter((s) => s.nodeId === 'e')).toHaveLength(1);
    expect(result.totalSteps).toBe(4);
  });
});
