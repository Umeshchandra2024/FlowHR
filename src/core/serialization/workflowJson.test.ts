import { describe, expect, it } from 'vitest'
import { makeEdge, validLinearGraph } from '../testing/fixtures'
import { fromWorkflowJSON, toGraph, toWorkflowJSON } from './workflowJson'

describe('workflow serialization', () => {
  it('round-trips toWorkflowJSON → fromWorkflowJSON → toGraph', () => {
    const { nodes, edges } = validLinearGraph()
    const json = toWorkflowJSON('Round trip', nodes, edges)

    const parsed = fromWorkflowJSON(JSON.parse(JSON.stringify(json)))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const graph = toGraph(parsed.value)
    expect(graph.nodes.map((n) => ({ id: n.id, type: n.type, data: n.data }))).toEqual(
      nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
    )
    expect(graph.edges.map((e) => [e.source, e.target])).toEqual(
      edges.map((e) => [e.source, e.target]),
    )
    // Hydrated edges are restyled from the source node kind
    expect(graph.edges[0].style?.stroke).toBeDefined()
  })

  it('fills missing data fields with registry defaults', () => {
    const parsed = fromWorkflowJSON({
      version: 1,
      name: 'Partial',
      nodes: [{ id: 'n1', kind: 'task', position: { x: 0, y: 0 }, data: { title: 'Only title' } }],
      edges: [],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.nodes[0].data).toMatchObject({
      title: 'Only title',
      description: '',
      assignee: '',
      customFields: [],
    })
  })

  it.each([
    ['not an object', 'nope'],
    ['wrong version', { version: 2, name: 'x', nodes: [], edges: [] }],
    ['missing name', { version: 1, nodes: [], edges: [] }],
    ['nodes not an array', { version: 1, name: 'x', nodes: {}, edges: [] }],
    [
      'unknown node kind',
      {
        version: 1,
        name: 'x',
        nodes: [{ id: 'n1', kind: 'alien', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      },
    ],
    [
      'invalid position',
      {
        version: 1,
        name: 'x',
        nodes: [{ id: 'n1', kind: 'task', position: { x: 'a', y: 0 }, data: {} }],
        edges: [],
      },
    ],
    [
      'edge to missing node',
      {
        version: 1,
        name: 'x',
        nodes: [{ id: 'n1', kind: 'start', position: { x: 0, y: 0 }, data: {} }],
        edges: [{ id: 'e1', source: 'n1', target: 'ghost' }],
      },
    ],
  ])('rejects malformed payloads: %s', (_label, payload) => {
    const parsed = fromWorkflowJSON(payload)
    expect(parsed.ok).toBe(false)
  })

  it('serializes only the persistent fields of edges', () => {
    const { nodes } = validLinearGraph()
    const edges = [{ ...makeEdge('s1', 't1'), animated: true, label: 'Step 2' }]
    const json = toWorkflowJSON('x', nodes, edges)
    expect(json.edges[0]).toEqual({ id: 's1->t1', source: 's1', target: 't1' })
  })
})
