import { useReactFlow } from '@xyflow/react'
import clsx from 'clsx'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  X,
} from 'lucide-react'
import { useSimulate } from '../../api/hooks'
import { getNodeDef } from '../../core/registry/nodeRegistry'
import { toWorkflowJSON } from '../../core/serialization/workflowJson'
import type { SimulationStep, ValidationIssue } from '../../core/types'
import { hasErrors } from '../../core/validation/graphValidation'
import { useSimulationStore } from '../../hooks/useSimulationStore'
import { useWorkflowStore } from '../../hooks/useWorkflowStore'
import { useWorkflowValidation } from '../../hooks/useWorkflowValidation'
import { useSimulationPlayback } from './useSimulationPlayback'

export function SimulationPanel() {
  const panelOpen = useSimulationStore((s) => s.panelOpen)
  const closePanel = useSimulationStore((s) => s.closePanel)
  const result = useSimulationStore((s) => s.result)
  const revealedSteps = useSimulationStore((s) => s.revealedSteps)
  const issues = useWorkflowValidation()
  const blocked = hasErrors(issues)
  const { run, isRunning, error } = useSimulate()
  const { play, reset } = useSimulationPlayback()
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode)
  const { setCenter } = useReactFlow()

  const focusIssue = (issue: ValidationIssue) => {
    if (!issue.nodeId) return
    const node = useWorkflowStore.getState().nodes.find((n) => n.id === issue.nodeId)
    if (!node) return
    setSelectedNode(node.id)
    setCenter(node.position.x + 120, node.position.y + 50, { zoom: 1.1, duration: 500 })
  }

  const onRun = async () => {
    const { name, nodes, edges } = useWorkflowStore.getState()
    reset()
    const simulation = await run(toWorkflowJSON(name, nodes, edges))
    if (simulation) play(simulation)
  }

  const playbackDone = result !== null && revealedSteps >= result.steps.length

  return (
    <div
      className={clsx(
        'absolute inset-y-0 right-0 z-20 flex w-96 flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-900/10 transition-transform duration-300',
        panelOpen ? 'translate-x-0' : 'translate-x-full',
      )}
      role="dialog"
      aria-label="Workflow test sandbox"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
          <Play size={15} aria-hidden />
        </span>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-800">Test workflow</h2>
          <p className="text-xs text-slate-400">Validate, simulate, and inspect the run</p>
        </div>
        <button
          type="button"
          onClick={closePanel}
          aria-label="Close sandbox"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Validation
          </h3>
          {issues.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <CheckCircle2 size={15} className="text-emerald-600" aria-hidden />
              <p className="text-xs font-medium text-emerald-700">Workflow is valid and ready to run</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {issues.map((issue) => (
                <li key={issue.id}>
                  <button
                    type="button"
                    onClick={() => focusIssue(issue)}
                    disabled={!issue.nodeId}
                    className={clsx(
                      'flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left',
                      issue.level === 'error'
                        ? 'border-rose-200 bg-rose-50'
                        : 'border-amber-200 bg-amber-50',
                      issue.nodeId && 'transition-colors hover:brightness-95',
                    )}
                  >
                    {issue.level === 'error' ? (
                      <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-600" aria-hidden />
                    ) : (
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                    )}
                    <span
                      className={clsx(
                        'text-xs',
                        issue.level === 'error' ? 'text-rose-700' : 'text-amber-700',
                      )}
                    >
                      {issue.message}
                      {issue.nodeId && <span className="mt-0.5 block text-[10px] opacity-60">Click to locate</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
            <AlertCircle size={14} className="text-rose-600" aria-hidden />
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        )}

        {result && (
          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Execution log
            </h3>
            <ol className="relative space-y-0">
              {result.steps.slice(0, revealedSteps).map((step, i) => (
                <TimelineStep
                  key={step.index}
                  step={step}
                  isLast={i === revealedSteps - 1 && playbackDone}
                />
              ))}
            </ol>
            {!playbackDone && (
              <p className="mt-2 flex items-center gap-1.5 pl-1 text-xs text-slate-400">
                <Loader2 size={12} className="animate-spin" aria-hidden />
                Executing…
              </p>
            )}
            {playbackDone && (
              <div
                className={clsx(
                  'mt-3 rounded-xl border px-3 py-2.5',
                  result.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-rose-200 bg-rose-50',
                )}
              >
                <p
                  className={clsx(
                    'text-xs font-semibold',
                    result.status === 'completed' ? 'text-emerald-700' : 'text-rose-700',
                  )}
                >
                  Run {result.status} — {result.totalSteps} steps in{' '}
                  {(result.totalDurationMs / 1000).toFixed(1)}s (simulated)
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={() => void onRun()}
          disabled={blocked || isRunning}
          title={blocked ? 'Fix the validation errors above before running' : undefined}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRunning ? (
            <Loader2 size={13} className="animate-spin" aria-hidden />
          ) : (
            <Play size={13} aria-hidden />
          )}
          {isRunning ? 'Simulating…' : 'Run simulation'}
        </button>
        {result && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={13} aria-hidden />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

function TimelineStep({ step, isLast }: { step: SimulationStep; isLast: boolean }) {
  const def = getNodeDef(step.nodeKind)
  const Icon = def.icon
  return (
    <li className={clsx('relative flex gap-2.5 pb-3 pl-1', isLast && 'pb-0')}>
      {!isLast && <span className="absolute top-7 left-[15px] bottom-0 w-px bg-slate-200" aria-hidden />}
      <span
        className={clsx(
          'z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white shadow-sm',
          def.color.chip,
        )}
      >
        <Icon size={13} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              'h-1.5 w-1.5 rounded-full',
              step.status === 'success' && 'bg-emerald-500',
              step.status === 'error' && 'bg-rose-500',
              step.status === 'skipped' && 'bg-slate-300',
            )}
            aria-hidden
          />
          <p className="truncate text-xs font-semibold text-slate-700">
            {step.index}. {step.nodeLabel}
          </p>
          <span className="ml-auto shrink-0 text-[10px] text-slate-400">{step.durationMs}ms</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.message}</p>
      </div>
    </li>
  )
}
