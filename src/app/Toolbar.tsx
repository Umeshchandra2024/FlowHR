import { useReactFlow } from '@xyflow/react'
import clsx from 'clsx'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FilePlus2,
  HelpCircle,
  Play,
  Redo2,
  Undo2,
  Upload,
  Wand2,
  Workflow,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { autoLayout } from '../core/layout/autoLayout'
import { hasErrors } from '../core/validation/graphValidation'
import { downloadWorkflow, readWorkflowFile } from '../features/io/workflowIO'
import { useLoadWorkflow } from '../hooks/useLoadWorkflow'
import { useSimulationStore } from '../hooks/useSimulationStore'
import { toast } from '../hooks/useToastStore'
import { useTemporalStore, useWorkflowStore } from '../hooks/useWorkflowStore'
import { useWorkflowValidation } from '../hooks/useWorkflowValidation'
import { AUTOSAVE_KEY } from './AppEffects'
import { ShortcutsModal } from './components/ShortcutsModal'

export function Toolbar() {
  const name = useWorkflowStore((s) => s.name)
  const setName = useWorkflowStore((s) => s.setName)
  const openPanel = useSimulationStore((s) => s.openPanel)
  const issues = useWorkflowValidation()
  const errorCount = issues.filter((i) => i.level === 'error').length
  const canUndo = useTemporalStore((s) => s.pastStates.length > 0)
  const canRedo = useTemporalStore((s) => s.futureStates.length > 0)
  const loadWorkflow = useLoadWorkflow()
  const { fitView } = useReactFlow()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const editable =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (event.key === '?' && !editable) setShortcutsOpen((open) => !open)
      if (event.key === 'Escape') setShortcutsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const onTidyUp = () => {
    const { nodes, edges, replaceNodes } = useWorkflowStore.getState()
    if (nodes.length === 0) return
    replaceNodes(autoLayout(nodes, edges))
    requestAnimationFrame(() => void fitView({ padding: 0.2, duration: 400 }))
  }

  const onExport = () => {
    const { name, nodes, edges } = useWorkflowStore.getState()
    if (nodes.length === 0) {
      toast('info', 'Nothing to export yet')
      return
    }
    downloadWorkflow(name, nodes, edges)
    toast('success', 'Workflow exported')
  }

  const onImportFile = async (file: File) => {
    const result = await readWorkflowFile(file)
    if (!result.ok) {
      toast('error', `Import failed: ${result.error}`)
      return
    }
    const { nodes } = useWorkflowStore.getState()
    if (nodes.length > 0 && !window.confirm('Importing replaces the current workflow. Continue?')) {
      return
    }
    loadWorkflow(result.value)
    toast('success', `Imported '${result.value.name}'`)
  }

  const onNew = () => {
    const { nodes, clear } = useWorkflowStore.getState()
    if (nodes.length > 0 && !window.confirm('Start fresh? The current workflow will be discarded.')) {
      return
    }
    clear()
    useWorkflowStore.temporal.getState().clear()
    localStorage.removeItem(AUTOSAVE_KEY)
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-white">
          <Workflow size={18} aria-hidden />
        </span>
        <span className="text-sm font-semibold tracking-tight">FlowHR</span>
      </div>

      <div className="h-6 w-px bg-slate-200" aria-hidden />

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Workflow name"
        className="w-52 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-slate-700 hover:border-slate-200 focus:border-accent-500 focus:outline-none"
      />

      <button
        type="button"
        onClick={openPanel}
        aria-label="Show validation results"
        className={clsx(
          'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
          hasErrors(issues)
            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
            : issues.length > 0
              ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
        )}
      >
        {hasErrors(issues) ? (
          <>
            <AlertCircle size={12} aria-hidden />
            {errorCount} error{errorCount > 1 ? 's' : ''}
          </>
        ) : issues.length > 0 ? (
          <>
            <AlertCircle size={12} aria-hidden />
            {issues.length} warning{issues.length > 1 ? 's' : ''}
          </>
        ) : (
          <>
            <CheckCircle2 size={12} aria-hidden />
            Valid
          </>
        )}
      </button>

      <div className="ml-auto flex items-center gap-1">
        <IconButton
          label="Undo (⌘Z)"
          disabled={!canUndo}
          onClick={() => useWorkflowStore.temporal.getState().undo()}
        >
          <Undo2 size={15} />
        </IconButton>
        <IconButton
          label="Redo (⇧⌘Z)"
          disabled={!canRedo}
          onClick={() => useWorkflowStore.temporal.getState().redo()}
        >
          <Redo2 size={15} />
        </IconButton>

        <div className="mx-1 h-6 w-px bg-slate-200" aria-hidden />

        <IconButton label="Tidy up layout" onClick={onTidyUp}>
          <Wand2 size={15} />
        </IconButton>
        <IconButton label="Export workflow as JSON" onClick={onExport}>
          <Download size={15} />
        </IconButton>
        <IconButton label="Import workflow from JSON" onClick={() => fileInputRef.current?.click()}>
          <Upload size={15} />
        </IconButton>
        <IconButton label="New workflow" onClick={onNew}>
          <FilePlus2 size={15} />
        </IconButton>
        <IconButton label="Keyboard shortcuts (?)" onClick={() => setShortcutsOpen(true)}>
          <HelpCircle size={15} />
        </IconButton>

        <div className="mx-1 h-6 w-px bg-slate-200" aria-hidden />

        <button
          type="button"
          onClick={openPanel}
          className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
        >
          <Play size={13} aria-hidden />
          Run simulation
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onImportFile(file)
          e.target.value = ''
        }}
      />

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </header>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}
