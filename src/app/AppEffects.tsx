import { useEffect } from 'react'
import { fromWorkflowJSON, toWorkflowJSON } from '../core/serialization/workflowJson'
import { useLoadWorkflow } from '../hooks/useLoadWorkflow'
import { toast } from '../hooks/useToastStore'
import { useWorkflowStore } from '../hooks/useWorkflowStore'

export const AUTOSAVE_KEY = 'flowhr:autosave'

function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event.target
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  )
}

/**
 * Invisible component (must live inside ReactFlowProvider) owning app-wide
 * side effects: localStorage autosave/restore and undo/redo keyboard shortcuts.
 */
export function AppEffects() {
  const loadWorkflow = useLoadWorkflow()

  // Restore last session once, then autosave on every (debounced) change.
  useEffect(() => {
    if (useWorkflowStore.getState().nodes.length === 0) {
      const raw = localStorage.getItem(AUTOSAVE_KEY)
      if (raw) {
        try {
          const result = fromWorkflowJSON(JSON.parse(raw))
          if (result.ok && result.value.nodes.length > 0) {
            loadWorkflow(result.value)
            toast('info', 'Restored your last session')
          }
        } catch {
          localStorage.removeItem(AUTOSAVE_KEY)
        }
      }
    }

    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = useWorkflowStore.subscribe((state) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        localStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify(toWorkflowJSON(state.name, state.nodes, state.edges)),
        )
      }, 800)
    })
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [loadWorkflow])

  // Undo/redo shortcuts (text inputs keep the browser's native text undo).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event)) return
      const meta = event.metaKey || event.ctrlKey
      const temporal = useWorkflowStore.temporal.getState()
      if (meta && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault()
        temporal.redo()
      } else if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        temporal.undo()
      } else if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        temporal.redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return null
}
