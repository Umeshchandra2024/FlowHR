import { MarkerType, addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import type { Connection, EdgeChange, NodeChange, XYPosition } from '@xyflow/react'
import { temporal } from 'zundo'
import { create } from 'zustand'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { getNodeDef } from '../core/registry/nodeRegistry'
import type { NodeData, NodeKind, WorkflowEdge, WorkflowNode } from '../core/types'

export type WorkflowState = {
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNodeId: string | null
  setName: (name: string) => void
  /** Returns the new node id, or null when the registry's maxInstances rule blocks it. */
  addNode: (kind: NodeKind, position: XYPosition) => string | null
  updateNodeData: (id: string, patch: Partial<NodeData>) => void
  deleteNode: (id: string) => void
  deleteSelected: () => void
  setSelectedNode: (id: string | null) => void
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  /** Replace the whole graph (import, templates, autosave restore). */
  setGraph: (name: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) => void
  /** Replace node positions/content wholesale (auto-layout). */
  replaceNodes: (nodes: WorkflowNode[]) => void
  clear: () => void
}

const EDGE_DEFAULTS = { type: 'smoothstep' as const }

export const useWorkflowStore = create<WorkflowState>()(
  temporal(
    (set, get) => ({
      name: 'Untitled workflow',
      nodes: [],
      edges: [],
      selectedNodeId: null,

      setName: (name) => set({ name }),

      addNode: (kind, position) => {
        const def = getNodeDef(kind)
        const { nodes } = get()
        if (def.maxInstances !== null) {
          const count = nodes.filter((n) => n.type === kind).length
          if (count >= def.maxInstances) return null
        }
        const id = crypto.randomUUID()
        // Constructing a union member generically — `kind` and `createDefaultData()`
        // always agree because both come from the same registry entry.
        const node = { id, type: kind, position, data: def.createDefaultData() } as WorkflowNode
        set({ nodes: [...nodes, node] })
        return id
      },

      updateNodeData: (id, patch) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? ({ ...node, data: { ...node.data, ...patch } } as WorkflowNode) : node,
          ),
        }))
      },

      deleteNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }))
      },

      deleteSelected: () => {
        const { selectedNodeId, deleteNode } = get()
        if (selectedNodeId) deleteNode(selectedNodeId)
      },

      setSelectedNode: (id) => {
        set((state) => ({
          selectedNodeId: id,
          nodes: state.nodes.map((n) =>
            (n.selected ?? false) === (n.id === id) ? n : ({ ...n, selected: n.id === id } as WorkflowNode),
          ),
        }))
      },

      onNodesChange: (changes) => {
        set((state) => {
          let selectedNodeId = state.selectedNodeId
          for (const change of changes) {
            if (change.type === 'select') {
              selectedNodeId = change.selected
                ? change.id
                : selectedNodeId === change.id
                  ? null
                  : selectedNodeId
            }
            if (change.type === 'remove' && change.id === selectedNodeId) selectedNodeId = null
          }
          return { nodes: applyNodeChanges(changes, state.nodes), selectedNodeId }
        })
      },

      onEdgesChange: (changes) => {
        set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }))
      },

      onConnect: (connection) => {
        set((state) => {
          const sourceNode = state.nodes.find((n) => n.id === connection.source)
          const hex = sourceNode ? getNodeDef(sourceNode.type).color.hex : '#94a3b8'
          const edge = {
            ...connection,
            ...EDGE_DEFAULTS,
            style: { stroke: hex },
            markerEnd: { type: MarkerType.ArrowClosed, color: hex, width: 18, height: 18 },
          }
          return { edges: addEdge(edge, state.edges) }
        })
      },

      setGraph: (name, nodes, edges) => {
        set({ name, nodes, edges: edges.map((e) => ({ ...EDGE_DEFAULTS, ...e })), selectedNodeId: null })
      },

      replaceNodes: (nodes) => set({ nodes }),

      clear: () => set({ name: 'Untitled workflow', nodes: [], edges: [], selectedNodeId: null }),
    }),
    {
      partialize: (state) => ({ name: state.name, nodes: state.nodes, edges: state.edges }),
      limit: 100,
      // Throttle history snapshots so a drag gesture becomes one undo step, not fifty.
      handleSet: (handleSet) => {
        let lastSave = 0
        return (state) => {
          const now = Date.now()
          if (now - lastSave < 300) return
          lastSave = now
          handleSet(state)
        }
      },
    },
  ),
)

/** Subscribe to the undo/redo history (zundo temporal store) with a selector. */
export function useTemporalStore<T>(
  selector: (state: ReturnType<typeof useWorkflowStore.temporal.getState>) => T,
): T {
  return useStoreWithEqualityFn(useWorkflowStore.temporal, selector)
}
