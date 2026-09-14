import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/apiError';
import type { WorkflowJSON } from '../domain/types';

export async function listWorkflows() {
  return prisma.workflow.findMany({ orderBy: { updatedAt: 'desc' } });
}

export async function createWorkflow(name: string, definition: WorkflowJSON) {
  return prisma.workflow.create({
    data: { name, definition: definition as unknown as Prisma.InputJsonValue },
  });
}

export async function getWorkflow(workflowId: string) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) {
    throw new ApiError(404, 'WORKFLOW_NOT_FOUND', 'Workflow not found');
  }
  return workflow;
}

export async function updateWorkflow(
  workflowId: string,
  updates: { name?: string; definition?: WorkflowJSON },
) {
  await getWorkflow(workflowId);
  return prisma.workflow.update({
    where: { id: workflowId },
    data: {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.definition !== undefined
        ? { definition: updates.definition as unknown as Prisma.InputJsonValue }
        : {}),
    },
  });
}

export async function deleteWorkflow(workflowId: string) {
  await getWorkflow(workflowId);
  await prisma.workflow.delete({ where: { id: workflowId } });
}
