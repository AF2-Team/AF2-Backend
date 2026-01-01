import { Router } from 'express';
import MessageController from './message.controller.js';

const router = Router();

router.post('/', MessageController.send);
router.get('/:conversationId', MessageController.list);

export default router;
