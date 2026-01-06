import { Router } from 'express';
import ConversationController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/', AuthMiddleware.authenticate, ConversationController.create);
router.get('/', AuthMiddleware.authenticate, ConversationController.list);
router.get('/:conversationId', AuthMiddleware.authenticate, ConversationController.get);

export default router;
