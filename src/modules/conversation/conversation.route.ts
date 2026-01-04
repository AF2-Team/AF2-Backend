import { Router } from 'express';
import ConversationController from './conversation.controller.js';
import MessageController from '../message/message.controller.js';

const router = Router();

router.get('/', ConversationController.list);
router.get('/:conversationId', ConversationController.get);
router.patch('/:conversationId/read', ConversationController.markRead);

router.get('/:conversationId/messages', MessageController.list);
router.post('/:conversationId/messages', MessageController.send);

export default router;
