import { Router } from 'express';
import NotificationController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', AuthMiddleware.authenticate, NotificationController.list);
router.put('/:id/read', AuthMiddleware.authenticate, NotificationController.markRead);
router.put('/read-all', AuthMiddleware.authenticate, NotificationController.markAllRead);

export default router;
