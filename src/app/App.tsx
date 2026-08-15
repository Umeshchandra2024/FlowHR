import { ReactFlowProvider } from '@xyflow/react'
import { WorkflowCanvas } from '../features/canvas/WorkflowCanvas'
import { Inspector } from '../features/inspector/Inspector'
import { Palette } from '../features/palette/Palette'
import { SimulationPanel } from '../features/simulation/SimulationPanel'
import { AppEffects } from './AppEffects'
import { Toolbar } from './Toolbar'
import { Toasts } from './components/Toasts'

export default function App() {
  return (
    <ReactFlowProvider>
      <AppEffects />
      <div className="flex h-full flex-col">
        <Toolbar />
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <aside className="w-60 shrink-0 border-r border-slate-200 bg-white" aria-label="Node palette">
            <Palette />
          </aside>
          <main className="min-w-0 flex-1 bg-slate-50">
            <WorkflowCanvas />
          </main>
          <aside className="w-80 shrink-0 border-l border-slate-200 bg-white" aria-label="Inspector">
            <Inspector />
          </aside>
          <SimulationPanel />
        </div>
      </div>
      <Toasts />
    </ReactFlowProvider>
  )
}
