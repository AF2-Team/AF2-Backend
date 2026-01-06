import { Router } from 'express';
import MessageController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/:conversationId', AuthMiddleware.authenticate, MessageController.send);
router.get('/:conversationId', AuthMiddleware.authenticate, MessageController.list);
router.put('/:conversationId/read', AuthMiddleware.authenticate, MessageController.markRead);

export default router;
