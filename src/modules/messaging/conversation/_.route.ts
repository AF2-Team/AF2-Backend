import { Router } from 'express';
import ConversationController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/', AuthMiddleware.authenticate, ConversationController.createConversation);
router.get('/', AuthMiddleware.authenticate, ConversationController.getMyConversations);
router.get('/:conversationId', AuthMiddleware.authenticate, ConversationController.getConversation);
router.put('/:conversationId/read', AuthMiddleware.authenticate, ConversationController.markConversationAsRead);

export default router;
