import { Router } from 'express';
import FeedController from './_.controller.js';

const router = Router();

router.get('/', FeedController.get);
router.get('/tags', FeedController.tags);

export default router;
