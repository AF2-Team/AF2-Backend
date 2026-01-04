import { Router } from 'express';
import NotificationController from './_.controller.js';

const router = Router();

router.get('/', NotificationController.list);
router.patch('/read', NotificationController.markRead);

export default router;
