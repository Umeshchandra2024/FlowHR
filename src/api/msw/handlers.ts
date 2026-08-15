import { HttpResponse, delay, http } from 'msw'
import { simulateWorkflow } from '../../core/simulation/engine'
import type { WorkflowJSON } from '../../core/types'
import { AUTOMATIONS } from '../mocks/automations'

/** Random latency so loading/async states are actually visible in the UI. */
const latency = () => delay(300 + Math.floor(Math.random() * 400))

export const handlers = [
  http.get('/automations', async () => {
    await latency()
    return HttpResponse.json(AUTOMATIONS)
  }),

  http.post('/simulate', async ({ request }) => {
    // The mock server trusts the payload shape: the client serializes it and the
    // sandbox validates the graph before it is ever sent here.
    const workflow = (await request.json()) as WorkflowJSON
    await latency()
    return HttpResponse.json(simulateWorkflow(workflow))
  }),
]
