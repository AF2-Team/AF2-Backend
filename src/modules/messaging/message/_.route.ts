import { Router } from 'express';
import MessageController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/:conversationId', AuthMiddleware.authenticate, MessageController.sendMessage);
router.get('/:conversationId', AuthMiddleware.authenticate, MessageController.getMessages);
router.put('/:conversationId/read', AuthMiddleware.authenticate, MessageController.markMessagesAsRead);

export default router;
