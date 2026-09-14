import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Same graph as the frontend's importable sample (flow.json) so a freshly-seeded backend and a
// freshly-loaded frontend demo show the same workflow.
const expenseReimbursementWorkflow = {
  version: 1,
  name: 'Expense Reimbursement',
  nodes: [
    {
      id: 'exp-start',
      kind: 'start',
      position: { x: 260, y: 0 },
      data: {
        title: 'Expense claim filed',
        metadata: [
          { id: 'exp-m1', key: 'department', value: 'Sales' },
          { id: 'exp-m2', key: 'policy', value: 'T&E-2026' },
        ],
      },
    },
    {
      id: 'exp-submit',
      kind: 'task',
      position: { x: 260, y: 150 },
      data: {
        title: 'Submit expense report',
        description: 'Attach itemized receipts and cost-center code',
        assignee: 'employee@acme.com',
        dueDate: '2026-09-01',
        customFields: [{ id: 'exp-c1', key: 'portal', value: 'Concur' }],
      },
    },
    {
      id: 'exp-mgr',
      kind: 'approval',
      position: { x: 260, y: 300 },
      data: { title: 'Manager sign-off', approverRole: 'Manager', autoApproveThreshold: 5000 },
    },
    {
      id: 'exp-notify',
      kind: 'automated',
      position: { x: 40, y: 460 },
      data: {
        title: 'Notify finance channel',
        actionId: 'slack_notify',
        actionLabel: 'Notify on Slack',
        params: { channel: '#finance-ops', message: 'New expense claim cleared manager sign-off' },
      },
    },
    {
      id: 'exp-audit',
      kind: 'task',
      position: { x: 480, y: 460 },
      data: {
        title: 'Verify receipts',
        description: 'Cross-check receipts against policy limits',
        assignee: 'finance@acme.com',
        dueDate: '2026-09-05',
        customFields: [],
      },
    },
    {
      id: 'exp-dir',
      kind: 'approval',
      position: { x: 480, y: 610 },
      data: { title: 'Finance approval', approverRole: 'Director', autoApproveThreshold: 1000 },
    },
    {
      id: 'exp-voucher',
      kind: 'automated',
      position: { x: 480, y: 760 },
      data: {
        title: 'Generate reimbursement voucher',
        actionId: 'generate_doc',
        actionLabel: 'Generate Document',
        params: { template: 'reimbursement-voucher', recipient: 'employee@acme.com' },
      },
    },
    {
      id: 'exp-end',
      kind: 'end',
      position: { x: 260, y: 910 },
      data: {
        endMessage: 'Reimbursement processed — payout scheduled in next cycle',
        includeSummary: true,
      },
    },
  ],
  edges: [
    { id: 'exp-e1', source: 'exp-start', target: 'exp-submit' },
    { id: 'exp-e2', source: 'exp-submit', target: 'exp-mgr' },
    { id: 'exp-e3', source: 'exp-mgr', target: 'exp-notify' },
    { id: 'exp-e4', source: 'exp-mgr', target: 'exp-audit' },
    { id: 'exp-e5', source: 'exp-audit', target: 'exp-dir' },
    { id: 'exp-e6', source: 'exp-dir', target: 'exp-voucher' },
    { id: 'exp-e7', source: 'exp-voucher', target: 'exp-end' },
    { id: 'exp-e8', source: 'exp-notify', target: 'exp-end' },
  ],
};

async function main() {
  const workflow = await prisma.workflow.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: { definition: expenseReimbursementWorkflow },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: expenseReimbursementWorkflow.name,
      definition: expenseReimbursementWorkflow,
    },
  });

  console.log(`Seeded workflow "${workflow.name}"`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
