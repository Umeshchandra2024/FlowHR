import { useReactFlow } from '@xyflow/react'
import clsx from 'clsx'
import { GripVertical, Sparkles } from 'lucide-react'
import { listNodeDefs } from '../../core/registry/nodeRegistry'
import { templates } from '../../core/templates'
import type { NodeKind } from '../../core/types'
import { useLoadWorkflow } from '../../hooks/useLoadWorkflow'
import { toast } from '../../hooks/useToastStore'
import { useWorkflowStore } from '../../hooks/useWorkflowStore'
import { addNodeWithFeedback } from '../canvas/WorkflowCanvas'
import { PALETTE_DND_MIME } from './dnd'

export function Palette() {
  const addNode = useWorkflowStore((s) => s.addNode)
  const loadWorkflow = useLoadWorkflow()
  const { screenToFlowPosition } = useReactFlow()

  const onLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return
    const { nodes } = useWorkflowStore.getState()
    if (nodes.length > 0 && !window.confirm('Loading a template replaces the current workflow. Continue?')) {
      return
    }
    loadWorkflow(template.workflow)
    toast('success', `Loaded '${template.label}' template`)
  }

  const onDragStart = (event: React.DragEvent, kind: NodeKind) => {
    event.dataTransfer.setData(PALETTE_DND_MIME, kind)
    event.dataTransfer.effectAllowed = 'move'
  }

  // Keyboard/click fallback for drag-and-drop: add near the viewport center with a
  // small offset per call so repeated adds don't stack perfectly.
  const onClickAdd = (kind: NodeKind) => {
    const jitter = Math.random() * 60 - 30
    const position = screenToFlowPosition({
      x: window.innerWidth / 2 + jitter,
      y: window.innerHeight / 2 + jitter,
    })
    addNodeWithFeedback(addNode, kind, position)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Nodes</h2>
        <p className="mt-0.5 text-xs text-slate-400">Drag onto the canvas, or click to add</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {listNodeDefs().map((def) => {
          const Icon = def.icon
          return (
            <button
              key={def.kind}
              type="button"
              draggable
              onDragStart={(e) => onDragStart(e, def.kind)}
              onClick={() => onClickAdd(def.kind)}
              aria-label={`Add ${def.label} node`}
              className="group flex w-full cursor-grab items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:cursor-grabbing"
            >
              <span
                className={clsx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  def.color.chip,
                )}
              >
                <Icon size={16} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-700">{def.label}</span>
                <span className="block truncate text-xs text-slate-400">{def.description}</span>
              </span>
              <GripVertical
                size={14}
                className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </button>
          )
        })}
      </div>

      <div className="border-t border-slate-100 p-3">
        <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
          Templates
        </h2>
        <div className="space-y-1.5">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onLoadTemplate(template.id)}
              className="flex w-full items-start gap-2 rounded-xl border border-dashed border-slate-200 p-2.5 text-left transition-colors hover:border-accent-200 hover:bg-accent-50"
            >
              <Sparkles size={14} className="mt-0.5 shrink-0 text-accent-500" aria-hidden />
              <span className="min-w-0">
                <span className="block text-xs font-medium text-slate-700">{template.label}</span>
                <span className="block text-[11px] leading-snug text-slate-400">
                  {template.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
