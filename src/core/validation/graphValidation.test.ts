import { describe, expect, it } from 'vitest'
import { makeEdge, makeNode, validLinearGraph } from '../testing/fixtures'
import { hasErrors, validateWorkflow } from './graphValidation'

describe('validateWorkflow', () => {
  it('accepts a valid linear workflow', () => {
    const { nodes, edges } = validLinearGraph()
    expect(validateWorkflow(nodes, edges)).toEqual([])
  })

  it('reports an empty canvas', () => {
    const issues = validateWorkflow([], [])
    expect(issues).toHaveLength(1)
    expect(issues[0].level).toBe('error')
  })

  it('requires exactly one start node', () => {
    const noStart = validateWorkflow(
      [makeNode('task', 't1', { title: 'T' }), makeNode('end', 'e1')],
      [makeEdge('t1', 'e1')],
    )
    expect(noStart.some((i) => i.id === 'no-start')).toBe(true)

    const { nodes, edges } = validLinearGraph()
    const twoStarts = validateWorkflow([...nodes, makeNode('start', 's2')], edges)
    expect(twoStarts.some((i) => i.id === 'multi-start')).toBe(true)
  })

  it('requires at least one end node', () => {
    const issues = validateWorkflow(
      [makeNode('start', 's1'), makeNode('task', 't1', { title: 'T' })],
      [makeEdge('s1', 't1')],
    )
    expect(issues.some((i) => i.id === 'no-end')).toBe(true)
  })

  it('flags nodes unreachable from start', () => {
    const { nodes, edges } = validLinearGraph()
    const stray = makeNode('task', 'stray', { title: 'Stray' })
    const strayEnd = makeNode('end', 'stray-end')
    const issues = validateWorkflow([...nodes, stray, strayEnd], [...edges, makeEdge('stray', 'stray-end')])
    expect(issues.some((i) => i.id === 'unreachable:stray')).toBe(true)
    expect(issues.some((i) => i.id === 'unreachable:stray-end')).toBe(true)
  })

  it('flags fully disconnected nodes as orphans, not unreachable', () => {
    const { nodes, edges } = validLinearGraph()
    const orphan = makeNode('task', 'orphan', { title: 'Orphan' })
    const issues = validateWorkflow([...nodes, orphan], edges)
    expect(issues.some((i) => i.id === 'orphan:orphan')).toBe(true)
    expect(issues.some((i) => i.id === 'unreachable:orphan')).toBe(false)
  })

  it('detects a simple cycle and names the nodes in it', () => {
    const nodes = [
      makeNode('start', 's1'),
      makeNode('task', 'a', { title: 'Task A' }),
      makeNode('task', 'b', { title: 'Task B' }),
      makeNode('end', 'e1'),
    ]
    const edges = [
      makeEdge('s1', 'a'),
      makeEdge('a', 'b'),
      makeEdge('b', 'a'), // cycle a -> b -> a
      makeEdge('b', 'e1'),
    ]
    const issues = validateWorkflow(nodes, edges)
    const cycle = issues.find((i) => i.id === 'cycle')
    expect(cycle).toBeDefined()
    expect(cycle!.message).toContain("'Task A'")
    expect(cycle!.message).toContain("'Task B'")
  })

  it('detects a cycle in a figure-eight shape', () => {
    const nodes = [
      makeNode('start', 's1'),
      makeNode('task', 'a', { title: 'A' }),
      makeNode('task', 'b', { title: 'B' }),
      makeNode('task', 'c', { title: 'C' }),
      makeNode('end', 'e1'),
    ]
    const edges = [
      makeEdge('s1', 'a'),
      makeEdge('a', 'b'),
      makeEdge('b', 'a'),
      makeEdge('b', 'c'),
      makeEdge('c', 'b'),
      makeEdge('c', 'e1'),
    ]
    expect(validateWorkflow(nodes, edges).some((i) => i.id === 'cycle')).toBe(true)
  })

  it('warns about dead ends without failing the workflow', () => {
    const { nodes, edges } = validLinearGraph()
    const deadEnd = makeNode('task', 'd1', { title: 'Dead end' })
    const issues = validateWorkflow([...nodes, deadEnd], [...edges, makeEdge('t1', 'd1')])
    const warning = issues.find((i) => i.id === 'dead-end:d1')
    expect(warning?.level).toBe('warning')
  })

  it('surfaces registry-level data issues with the node title', () => {
    const { nodes, edges } = validLinearGraph()
    const untitled = nodes.map((n) => (n.id === 't1' ? { ...n, data: { ...n.data, title: '' } } : n))
    const issues = validateWorkflow(untitled as typeof nodes, edges)
    expect(issues.some((i) => i.nodeId === 't1' && i.message.includes('Title is required'))).toBe(true)
    expect(hasErrors(issues)).toBe(true)
  })

  it('sorts errors before warnings', () => {
    const { nodes, edges } = validLinearGraph()
    const deadEnd = makeNode('automated', 'd1') // dead end AND invalid data
    const issues = validateWorkflow([...nodes, deadEnd], [...edges, makeEdge('t1', 'd1')])
    const firstWarning = issues.findIndex((i) => i.level === 'warning')
    const lastError = issues.map((i) => i.level).lastIndexOf('error')
    expect(lastError).toBeLessThan(firstWarning)
  })
})
