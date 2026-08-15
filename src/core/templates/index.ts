import type { WorkflowJSON } from '../types'

export type WorkflowTemplate = {
  id: string
  label: string
  description: string
  workflow: WorkflowJSON
}

/**
 * Prebuilt, fully-configured workflows. They reuse the exact import pipeline
 * (fromWorkflowJSON → toGraph), so they double as living fixtures for it.
 */
export const templates: WorkflowTemplate[] = [
  {
    id: 'onboarding',
    label: 'Employee Onboarding',
    description: 'Docs, IT setup and welcome email with a parallel branch',
    workflow: {
      version: 1,
      name: 'Employee Onboarding',
      nodes: [
        {
          id: 'ob-start',
          kind: 'start',
          position: { x: 260, y: 0 },
          data: {
            title: 'New hire joins',
            metadata: [{ id: 'ob-m1', key: 'role', value: 'Engineer' }],
          },
        },
        {
          id: 'ob-docs',
          kind: 'task',
          position: { x: 260, y: 150 },
          data: {
            title: 'Collect documents',
            description: 'ID proof, signed offer letter and bank details',
            assignee: 'hr@acme.com',
            dueDate: '2026-01-15',
            customFields: [{ id: 'ob-c1', key: 'portal', value: 'DocuSign' }],
          },
        },
        {
          id: 'ob-email',
          kind: 'automated',
          position: { x: 80, y: 310 },
          data: {
            title: 'Send welcome email',
            actionId: 'send_email',
            actionLabel: 'Send Email',
            params: { to: 'new.hire@acme.com', subject: 'Welcome to Acme!' },
          },
        },
        {
          id: 'ob-laptop',
          kind: 'task',
          position: { x: 440, y: 310 },
          data: {
            title: 'Provision laptop',
            description: 'MacBook + access badges',
            assignee: 'it@acme.com',
            dueDate: '2026-01-18',
            customFields: [],
          },
        },
        {
          id: 'ob-approval',
          kind: 'approval',
          position: { x: 260, y: 470 },
          data: { title: 'Manager sign-off', approverRole: 'Manager', autoApproveThreshold: 0 },
        },
        {
          id: 'ob-end',
          kind: 'end',
          position: { x: 260, y: 620 },
          data: { endMessage: 'Onboarding complete — welcome aboard!', includeSummary: true },
        },
      ],
      edges: [
        { id: 'ob-e1', source: 'ob-start', target: 'ob-docs' },
        { id: 'ob-e2', source: 'ob-docs', target: 'ob-email' },
        { id: 'ob-e3', source: 'ob-docs', target: 'ob-laptop' },
        { id: 'ob-e4', source: 'ob-email', target: 'ob-approval' },
        { id: 'ob-e5', source: 'ob-laptop', target: 'ob-approval' },
        { id: 'ob-e6', source: 'ob-approval', target: 'ob-end' },
      ],
    },
  },
  {
    id: 'leave-approval',
    label: 'Leave Approval',
    description: 'Linear request → HRBP approval → Slack notification',
    workflow: {
      version: 1,
      name: 'Leave Approval',
      nodes: [
        {
          id: 'la-start',
          kind: 'start',
          position: { x: 200, y: 0 },
          data: {
            title: 'Leave request',
            metadata: [{ id: 'la-m1', key: 'type', value: 'PTO' }],
          },
        },
        {
          id: 'la-form',
          kind: 'task',
          position: { x: 200, y: 150 },
          data: {
            title: 'Submit leave form',
            description: 'Dates, reason and handover notes',
            assignee: 'employee@acme.com',
            dueDate: '',
            customFields: [],
          },
        },
        {
          id: 'la-approval',
          kind: 'approval',
          position: { x: 200, y: 300 },
          data: { title: 'HRBP approval', approverRole: 'HRBP', autoApproveThreshold: 2 },
        },
        {
          id: 'la-notify',
          kind: 'automated',
          position: { x: 200, y: 450 },
          data: {
            title: 'Notify the team',
            actionId: 'slack_notify',
            actionLabel: 'Notify on Slack',
            params: { channel: '#hr-updates', message: 'Leave approved' },
          },
        },
        {
          id: 'la-end',
          kind: 'end',
          position: { x: 200, y: 600 },
          data: { endMessage: 'Leave processed', includeSummary: false },
        },
      ],
      edges: [
        { id: 'la-e1', source: 'la-start', target: 'la-form' },
        { id: 'la-e2', source: 'la-form', target: 'la-approval' },
        { id: 'la-e3', source: 'la-approval', target: 'la-notify' },
        { id: 'la-e4', source: 'la-notify', target: 'la-end' },
      ],
    },
  },
]
