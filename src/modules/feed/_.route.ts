import { Router } from 'express';
import FeedController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', AuthMiddleware.authenticate, FeedController.get);
router.get('/tags', AuthMiddleware.authenticate, FeedController.tags);

export default router;
