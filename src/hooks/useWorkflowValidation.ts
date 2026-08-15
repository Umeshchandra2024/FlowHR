import { useMemo } from 'react'
import { validateWorkflow } from '../core/validation/graphValidation'
import type { ValidationIssue } from '../core/types'
import { useWorkflowStore } from './useWorkflowStore'

/** Live validation of the current graph, recomputed only when nodes/edges change. */
export function useWorkflowValidation(): ValidationIssue[] {
  const nodes = useWorkflowStore((s) => s.nodes)
  const edges = useWorkflowStore((s) => s.edges)
  return useMemo(() => validateWorkflow(nodes, edges), [nodes, edges])
}
