import { describe, expect, it } from 'vitest'
import sample from '../../../samples/expense-reimbursement.flow.json'
import { validateWorkflow } from '../validation/graphValidation'
import { fromWorkflowJSON, toGraph } from './workflowJson'

describe('bundled sample file', () => {
  it('imports cleanly and produces a valid graph', () => {
    const parsed = fromWorkflowJSON(sample)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const { nodes, edges } = toGraph(parsed.value)
    expect(nodes).toHaveLength(8)
    expect(edges).toHaveLength(8)
    const issues = validateWorkflow(nodes, edges)
    expect(issues.filter((i) => i.level === 'error')).toEqual([])
  })
})
