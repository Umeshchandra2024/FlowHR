import type { AutomationAction } from '../../core/types'

/** Catalog served by GET /automations — the case study's two actions plus two extras. */
export const AUTOMATIONS: AutomationAction[] = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
  { id: 'create_ticket', label: 'Create IT Ticket', params: ['system', 'priority'] },
  { id: 'slack_notify', label: 'Notify on Slack', params: ['channel', 'message'] },
]
