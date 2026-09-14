import { Router } from 'express';
import workflowsRoutes from './workflows.routes';
import automationsRoutes from './automations.routes';

const router = Router();

router.use('/workflows', workflowsRoutes);
router.use('/automations', automationsRoutes);

export default router;
