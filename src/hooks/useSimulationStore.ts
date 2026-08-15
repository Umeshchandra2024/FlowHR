import { create } from 'zustand'
import type { SimulationResult } from '../core/types'

export type PlaybackNodeStatus = 'active' | 'done'

type SimulationState = {
  panelOpen: boolean
  result: SimulationResult | null
  /** How many steps of the result are currently revealed in the timeline. */
  revealedSteps: number
  /** Per-node playback styling for the canvas. */
  nodeStatus: Record<string, PlaybackNodeStatus>
  /** Edges already traversed during playback, with the step they belonged to. */
  traversedEdges: Record<string, number>
  openPanel: () => void
  closePanel: () => void
  startPlayback: (result: SimulationResult) => void
  revealNextStep: () => void
  reset: () => void
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  panelOpen: false,
  result: null,
  revealedSteps: 0,
  nodeStatus: {},
  traversedEdges: {},

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  startPlayback: (result) =>
    set({ result, revealedSteps: 0, nodeStatus: {}, traversedEdges: {} }),

  revealNextStep: () => {
    const { result, revealedSteps, nodeStatus, traversedEdges } = get()
    if (!result || revealedSteps >= result.steps.length) return
    const step = result.steps[revealedSteps]
    const nextStatus: Record<string, PlaybackNodeStatus> = {}
    for (const [nodeId, status] of Object.entries(nodeStatus)) {
      nextStatus[nodeId] = status === 'active' ? 'done' : status
    }
    nextStatus[step.nodeId] = 'active'
    const nextEdges = { ...traversedEdges }
    if (step.viaEdgeId) nextEdges[step.viaEdgeId] = step.index
    const isLast = revealedSteps + 1 === result.steps.length
    if (isLast) nextStatus[step.nodeId] = 'done'
    set({ revealedSteps: revealedSteps + 1, nodeStatus: nextStatus, traversedEdges: nextEdges })
  },

  reset: () => set({ result: null, revealedSteps: 0, nodeStatus: {}, traversedEdges: {} }),
}))
