import clsx from 'clsx'
import { MousePointerClick, Trash2 } from 'lucide-react'
import { getNodeDef, validateNodeData } from '../../core/registry/nodeRegistry'
import type { NodeData } from '../../core/types'
import { useWorkflowStore } from '../../hooks/useWorkflowStore'
import { NodeFormRenderer } from './NodeFormRenderer'

export function Inspector() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const node = useWorkflowStore((s) =>
    s.selectedNodeId ? s.nodes.find((n) => n.id === s.selectedNodeId) : undefined,
  )
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)
  const deleteNode = useWorkflowStore((s) => s.deleteNode)

  if (!node || !selectedNodeId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <MousePointerClick size={18} aria-hidden />
        </span>
        <p className="text-sm font-medium text-slate-500">Nothing selected</p>
        <p className="text-xs text-slate-400">Select a node on the canvas to configure it</p>
      </div>
    )
  }

  const def = getNodeDef(node.type)
  const Icon = def.icon
  const issues = validateNodeData(node.type, node.data)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <span className={clsx('flex h-8 w-8 items-center justify-center rounded-lg', def.color.chip)}>
          <Icon size={16} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            {def.label}
            {issues.length > 0 && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-rose-500"
                title={issues.join('\n')}
                aria-label={`${issues.length} validation issue(s)`}
              />
            )}
          </p>
          <p className="truncate text-xs text-slate-400">{def.description}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">
          {node.type}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <NodeFormRenderer
          kind={node.type}
          data={node.data}
          onPatch={(patch: Partial<NodeData>) => updateNodeData(selectedNodeId, patch)}
        />
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={() => deleteNode(selectedNodeId)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
        >
          <Trash2 size={13} aria-hidden />
          Delete node
        </button>
      </div>
    </div>
  )
}
