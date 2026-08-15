import { describe, expect, it } from 'vitest'
import { toWorkflowJSON } from '../serialization/workflowJson'
import { makeEdge, makeNode, validLinearGraph } from '../testing/fixtures'
import type { WorkflowEdge, WorkflowNode } from '../types'
import { simulateWorkflow } from './engine'

const fixedRng = () => 0.5

function serialize(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  return toWorkflowJSON('Test workflow', nodes, edges)
}

describe('simulateWorkflow', () => {
  it('executes a linear flow in order with per-kind messages', () => {
    const { nodes, edges } = validLinearGraph()
    const result = simulateWorkflow(serialize(nodes, edges), fixedRng)

    expect(result.status).toBe('completed')
    expect(result.steps.map((s) => s.nodeId)).toEqual(['s1', 't1', 'e1'])
    expect(result.steps.map((s) => s.index)).toEqual([1, 2, 3])
    expect(result.steps[0].message).toContain("Workflow 'Start' started")
    expect(result.steps[1].message).toContain("Task 'Collect documents' assigned to hr@acme.com")
    expect(result.steps[2].message).toContain('Workflow completed')
    expect(result.totalSteps).toBe(3)
    expect(result.totalDurationMs).toBe(result.steps.reduce((sum, s) => sum + s.durationMs, 0))
  })

  it('records the edge traversed to reach each node', () => {
    const { nodes, edges } = validLinearGraph()
    const result = simulateWorkflow(serialize(nodes, edges), fixedRng)
    expect(result.steps[0].viaEdgeId).toBeUndefined()
    expect(result.steps[1].viaEdgeId).toBe('s1->t1')
    expect(result.steps[2].viaEdgeId).toBe('t1->e1')
  })

  it('walks parallel branches breadth-first and visits each node once', () => {
    const nodes = [
      makeNode('start', 's1'),
      makeNode('task', 'a', { title: 'A' }),
      makeNode('task', 'b', { title: 'B' }),
      makeNode('end', 'e1'),
    ]
    const edges = [
      makeEdge('s1', 'a'),
      makeEdge('s1', 'b'),
      makeEdge('a', 'e1'),
      makeEdge('b', 'e1'),
    ]
    const result = simulateWorkflow(serialize(nodes, edges), fixedRng)
    expect(result.steps.map((s) => s.nodeId)).toEqual(['s1', 'a', 'b', 'e1'])
  })

  it('fails the run when an automated step has no action configured', () => {
    const nodes = [
      makeNode('start', 's1'),
      makeNode('automated', 'auto', { title: 'Broken step' }),
      makeNode('end', 'e1'),
    ]
    const edges = [makeEdge('s1', 'auto'), makeEdge('auto', 'e1')]
    const result = simulateWorkflow(serialize(nodes, edges), fixedRng)
    expect(result.status).toBe('failed')
    expect(result.steps[1].status).toBe('error')
  })

  it('includes automation params and the summary flag in messages', () => {
    const nodes = [
      makeNode('start', 's1'),
      makeNode('automated', 'auto', {
        title: 'Welcome mail',
        actionId: 'send_email',
        actionLabel: 'Send Email',
        params: { to: 'a@b.com', subject: 'Hi' },
      }),
      makeNode('end', 'e1', { endMessage: 'Done!', includeSummary: true }),
    ]
    const edges = [makeEdge('s1', 'auto'), makeEdge('auto', 'e1')]
    const result = simulateWorkflow(serialize(nodes, edges), fixedRng)
    expect(result.steps[1].message).toContain("Executed 'Send Email'")
    expect(result.steps[1].message).toContain('to="a@b.com"')
    expect(result.steps[2].message).toContain('Done!')
    expect(result.steps[2].message).toContain('summary: 2 step(s)')
  })

  it('returns a failed empty result when there is no start node', () => {
    const nodes = [makeNode('task', 't1', { title: 'T' }), makeNode('end', 'e1')]
    const result = simulateWorkflow(serialize(nodes, [makeEdge('t1', 'e1')]), fixedRng)
    expect(result.status).toBe('failed')
    expect(result.steps).toEqual([])
  })

  it('terminates on cyclic graphs by visiting each node once', () => {
    const nodes = [makeNode('start', 's1'), makeNode('task', 'a', { title: 'A' }), makeNode('end', 'e1')]
    const edges = [makeEdge('s1', 'a'), makeEdge('a', 'a'), makeEdge('a', 'e1')]
    const result = simulateWorkflow(serialize(nodes, edges), fixedRng)
    expect(result.steps.length).toBe(3)
  })
})
