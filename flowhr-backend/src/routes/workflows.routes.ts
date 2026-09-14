import { Router } from 'express';
import { runRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';
import * as workflowsController from '../controllers/workflows.controller';

const router = Router();

router.get('/', asyncHandler(workflowsController.list));
router.post('/', asyncHandler(workflowsController.create));
router.get('/:id', asyncHandler(workflowsController.getOne));
router.put('/:id', asyncHandler(workflowsController.update));
router.delete('/:id', asyncHandler(workflowsController.remove));
router.post('/:id/run', runRateLimiter, asyncHandler(workflowsController.run));
router.get('/:id/runs', asyncHandler(workflowsController.runs));

export default router;
