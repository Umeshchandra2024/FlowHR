import { X } from 'lucide-react'

const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: '⌫ / Delete', action: 'Delete selected nodes or edges' },
  { keys: '⌘/Ctrl + Z', action: 'Undo' },
  { keys: '⇧⌘Z / Ctrl+Y', action: 'Redo' },
  { keys: 'Esc', action: 'Deselect / close dialogs' },
  { keys: '?', action: 'Toggle this overlay' },
]

type Props = {
  open: boolean
  onClose: () => void
}

export function ShortcutsModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
        <ul className="space-y-2.5">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">{s.action}</span>
              <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
