import type { Request, Response } from 'express';
import { createWorkflowSchema, updateWorkflowSchema } from '../validators/workflow.schema';
import * as workflowService from '../services/workflowService';
import * as runService from '../services/runService';

export async function list(_req: Request, res: Response): Promise<void> {
  const workflows = await workflowService.listWorkflows();
  res.json({ data: workflows });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createWorkflowSchema.parse(req.body);
  const workflow = await workflowService.createWorkflow(input.name, input.definition);
  res.status(201).json({ data: workflow });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const workflow = await workflowService.getWorkflow(req.params.id);
  res.json({ data: workflow });
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateWorkflowSchema.parse(req.body);
  const workflow = await workflowService.updateWorkflow(req.params.id, input);
  res.json({ data: workflow });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await workflowService.deleteWorkflow(req.params.id);
  res.status(204).send();
}

export async function run(req: Request, res: Response): Promise<void> {
  const result = await runService.executeWorkflowRun(req.params.id);
  res.json({ data: result });
}

export async function runs(req: Request, res: Response): Promise<void> {
  const runList = await runService.listRuns(req.params.id);
  res.json({ data: runList });
}
