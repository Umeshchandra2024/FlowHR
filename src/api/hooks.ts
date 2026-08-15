import { useCallback, useEffect, useState } from 'react'
import type { AutomationAction, SimulationResult, WorkflowJSON } from '../core/types'
import { api } from './client'

// Module-level cache: the automation catalog is static per session, so selecting
// different nodes must not refetch it. The hook API mirrors react-query's shape
// on purpose — swapping it in later would be a drop-in change.
let automationsCache: AutomationAction[] | null = null

export type AutomationsQuery = {
  data: AutomationAction[] | null
  isLoading: boolean
  error: string | null
  retry: () => void
}

export function useAutomations(): AutomationsQuery {
  const [data, setData] = useState<AutomationAction[] | null>(automationsCache)
  const [isLoading, setIsLoading] = useState(automationsCache === null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const actions = await api.get<AutomationAction[]>('/automations')
      automationsCache = actions
      setData(actions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (automationsCache === null) void load()
  }, [load])

  return { data, isLoading, error, retry: () => void load() }
}

export type SimulateMutation = {
  run: (workflow: WorkflowJSON) => Promise<SimulationResult | null>
  result: SimulationResult | null
  isRunning: boolean
  error: string | null
  reset: () => void
}

export function useSimulate(): SimulateMutation {
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (workflow: WorkflowJSON) => {
    setIsRunning(true)
    setError(null)
    try {
      const simulation = await api.post<SimulationResult>('/simulate', workflow)
      setResult(simulation)
      return simulation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed')
      return null
    } finally {
      setIsRunning(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { run, result, isRunning, error, reset }
}
