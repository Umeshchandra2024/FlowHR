import { Router } from 'express';
import * as automationsController from '../controllers/automations.controller';

const router = Router();

router.get('/', automationsController.list);

export default router;
