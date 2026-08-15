import { useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'
import { toGraph } from '../core/serialization/workflowJson'
import type { WorkflowJSON } from '../core/types'
import { useWorkflowStore } from './useWorkflowStore'

/**
 * Single entry point for hydrating a whole workflow (templates, file import,
 * autosave restore): swaps the graph, wipes undo history, and refits the view.
 */
export function useLoadWorkflow() {
  const { fitView } = useReactFlow()

  return useCallback(
    (json: WorkflowJSON) => {
      const { nodes, edges } = toGraph(json)
      useWorkflowStore.getState().setGraph(json.name, nodes, edges)
      useWorkflowStore.temporal.getState().clear()
      requestAnimationFrame(() => {
        void fitView({ padding: 0.2, duration: 400 })
      })
    },
    [fitView],
  )
}
