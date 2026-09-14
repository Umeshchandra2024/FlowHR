import type { Request, Response } from 'express';
import { AUTOMATION_CATALOG } from '../domain/automations/registry';

export function list(_req: Request, res: Response): void {
  res.json({ data: AUTOMATION_CATALOG });
}
