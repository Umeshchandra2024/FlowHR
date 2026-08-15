import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css'
import './index.css'
import App from './app/App'

// MSW is the app's only backend (the case study requires no real persistence),
// so the worker runs in every mode, not just dev.
async function enableMocking() {
  const { worker } = await import('./api/msw/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
