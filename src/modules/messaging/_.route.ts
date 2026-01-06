import { Router } from 'express';
import ConversationRoutes from './conversation/_.route.js';
import MessageRoutes from './message/_.route.js';

const router = Router();

router.use('/conversations', ConversationRoutes);
router.use('/messages', MessageRoutes);

export default router;
