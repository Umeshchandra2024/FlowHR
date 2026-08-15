import { Handle, Position, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import { AlertTriangle, Check } from 'lucide-react'
import { memo } from 'react'
import { getNodeDef, nodeSubtitle, validateNodeData } from '../../core/registry/nodeRegistry'
import type { WorkflowNode } from '../../core/types'
import { useSimulationStore } from '../../hooks/useSimulationStore'

/**
 * The single card component behind every node kind — everything kind-specific
 * (icon, colors, subtitle, validation) comes from the registry.
 */
function WorkflowNodeCardInner({ id, type, data, selected }: NodeProps<WorkflowNode>) {
  const def = getNodeDef(type)
  const Icon = def.icon
  const issues = validateNodeData(type, data)
  const title = 'title' in data && data.title.trim() ? data.title : def.label
  const playback = useSimulationStore((s) => s.nodeStatus[id])

  return (
    <div
      style={{ '--pulse-color': `${def.color.hex}55` } as React.CSSProperties}
      className={clsx(
        'w-60 rounded-xl border bg-white p-3 shadow-sm transition-all duration-150',
        selected
          ? `border-transparent ring-2 ${def.color.ring}`
          : 'border-slate-200 hover:-translate-y-0.5 hover:shadow-md',
        playback === 'active' && 'simulating-node',
      )}
    >
      {def.maxIncoming !== 0 && <Handle type="target" position={Position.Top} />}

      <div className="flex items-start gap-2.5">
        <span
          className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', def.color.chip)}
        >
          <Icon size={16} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
          <p className="truncate text-xs text-slate-500">{nodeSubtitle(type, data)}</p>
        </div>
        {playback === 'done' && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check size={12} aria-hidden />
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">
          {def.label}
        </span>
        {issues.length > 0 ? (
          <span
            title={issues.join('\n')}
            className="flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600"
          >
            <AlertTriangle size={10} aria-hidden />
            {issues.length} issue{issues.length > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
            <Check size={10} aria-hidden />
            Ready
          </span>
        )}
      </div>

      {def.maxOutgoing !== 0 && <Handle type="source" position={Position.Bottom} />}
    </div>
  )
}

export const WorkflowNodeCard = memo(WorkflowNodeCardInner)
