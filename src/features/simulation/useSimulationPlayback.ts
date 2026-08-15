import { useCallback, useEffect, useRef } from 'react'
import type { SimulationResult } from '../../core/types'
import { useSimulationStore } from '../../hooks/useSimulationStore'

const STEP_REVEAL_MS = 450

/**
 * Drives the "live execution" effect: reveals one step at a time so the timeline
 * and the canvas highlights advance together. All visual state lives in the
 * simulation store; this hook only owns the timer.
 */
export function useSimulationPlayback() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const play = useCallback(
    (result: SimulationResult) => {
      stopTimer()
      const store = useSimulationStore.getState()
      store.startPlayback(result)
      store.revealNextStep()
      intervalRef.current = setInterval(() => {
        const state = useSimulationStore.getState()
        if (!state.result || state.revealedSteps >= state.result.steps.length) {
          stopTimer()
          return
        }
        state.revealNextStep()
      }, STEP_REVEAL_MS)
    },
    [stopTimer],
  )

  const reset = useCallback(() => {
    stopTimer()
    useSimulationStore.getState().reset()
  }, [stopTimer])

  useEffect(() => stopTimer, [stopTimer])

  return { play, reset }
}
