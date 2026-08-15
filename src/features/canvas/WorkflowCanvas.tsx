import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo } from 'react'
import { getNodeDef, listNodeDefs } from '../../core/registry/nodeRegistry'
import type { NodeKind, WorkflowNode } from '../../core/types'
import { canConnect } from '../../core/validation/connectionRules'
import { useSimulationStore } from '../../hooks/useSimulationStore'
import { toast } from '../../hooks/useToastStore'
import { useWorkflowStore } from '../../hooks/useWorkflowStore'
import { PALETTE_DND_MIME, isNodeKind } from '../palette/dnd'
import { WorkflowNodeCard } from './WorkflowNodeCard'

// One card component serves every kind; React Flow just needs the kind→component map.
const nodeTypes: NodeTypes = Object.fromEntries(
  listNodeDefs().map((def) => [def.kind, WorkflowNodeCard]),
)

function isInputTarget(event: KeyboardEvent): boolean {
  const target = event.target
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  )
}

export function WorkflowCanvas() {
  const nodes = useWorkflowStore((s) => s.nodes)
  const edges = useWorkflowStore((s) => s.edges)
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange)
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange)
  const onConnect = useWorkflowStore((s) => s.onConnect)
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode)
  const addNode = useWorkflowStore((s) => s.addNode)
  const traversedEdges = useSimulationStore((s) => s.traversedEdges)
  const { screenToFlowPosition } = useReactFlow()

  // Overlay simulation playback onto edges: traversed edges animate and carry a
  // step-number pill at their midpoint (the reference UI's labeled-edge look).
  const displayEdges = useMemo(
    () =>
      edges.map((edge) => {
        const stepIndex = traversedEdges[edge.id]
        if (stepIndex === undefined) return edge
        return {
          ...edge,
          animated: true,
          label: `Step ${stepIndex}`,
          labelStyle: { fontSize: 10, fontWeight: 600, fill: '#334155' },
          labelBgStyle: { fill: '#ffffff', stroke: '#e2e8f0' },
          labelBgPadding: [6, 3] as [number, number],
          labelBgBorderRadius: 8,
        }
      }),
    [edges, traversedEdges],
  )

  const isValidConnection = useCallback((connection: Edge | Connection) => {
    const { nodes, edges } = useWorkflowStore.getState()
    return canConnect(connection, nodes, edges)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const kind = event.dataTransfer.getData(PALETTE_DND_MIME)
      if (!isNodeKind(kind)) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addNodeWithFeedback(addNode, kind, position)
    },
    [addNode, screenToFlowPosition],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isInputTarget(event)) setSelectedNode(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setSelectedNode])

  return (
    <div className="relative h-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onPaneClick={() => setSelectedNode(null)}
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid
        snapGrid={[16, 16]}
        fitView
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#cbd5e1" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(node) => getNodeDef((node as WorkflowNode).type).color.hex}
          nodeStrokeWidth={0}
          className="overflow-hidden rounded-xl border border-slate-200 shadow-sm"
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-slate-300">
              <span className="text-2xl">+</span>
            </div>
            <p className="text-sm font-medium text-slate-500">Drag a Start node to begin</p>
            <p className="mt-1 text-xs text-slate-400">
              Build your workflow from the palette on the left
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/** Shared add-node path (drop + click-to-add) with the "only one Start" feedback. */
export function addNodeWithFeedback(
  addNode: (kind: NodeKind, position: { x: number; y: number }) => string | null,
  kind: NodeKind,
  position: { x: number; y: number },
): void {
  const id = addNode(kind, position)
  if (id === null) {
    toast('error', `Only ${getNodeDef(kind).maxInstances} ${getNodeDef(kind).label} node is allowed`)
  }
}
