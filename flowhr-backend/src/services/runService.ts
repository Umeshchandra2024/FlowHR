import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/apiError';
import { validateWorkflow, isWorkflowValid } from '../domain/graph/validate';
import { runWorkflow } from '../domain/execution/engine';
import { createAutomationExecutors } from '../domain/automations/registry';
import { sendEmail } from './emailService';
import { getWorkflow } from './workflowService';
import type { WorkflowJSON } from '../domain/types';

export async function executeWorkflowRun(workflowId: string) {
  const workflow = await getWorkflow(workflowId);
  const definition = workflow.definition as unknown as WorkflowJSON;

  // Never trust the client's own "this graph is valid" state — re-derive it here from the
  // persisted definition before executing anything.
  const issues = validateWorkflow(definition.nodes, definition.edges);
  if (!isWorkflowValid(issues)) {
    logger.warn({ workflowId, issues }, 'Workflow run rejected: invalid graph');
    throw new ApiError(422, 'INVALID_WORKFLOW', issues.map((issue) => issue.message).join('; '));
  }

  const executors = createAutomationExecutors({ sendEmail, emailSendingEnabled: env.EMAIL_SENDING_ENABLED });

  logger.info({ workflowId }, 'Workflow run started');
  const startedAt = new Date();
  const result = await runWorkflow(definition, { automationExecutors: executors });
  const completedAt = new Date();

  const run = await prisma.workflowRun.create({
    data: {
      workflowId,
      status: result.status,
      startedAt,
      completedAt,
      resultLog: result as unknown as Prisma.InputJsonValue,
    },
  });

  logger.info({ workflowId, runId: run.id, status: result.status }, 'Workflow run finished');

  return result;
}

export async function listRuns(workflowId: string) {
  await getWorkflow(workflowId);
  return prisma.workflowRun.findMany({ where: { workflowId }, orderBy: { startedAt: 'desc' } });
}
