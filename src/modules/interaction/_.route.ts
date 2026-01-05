import { Router } from 'express';
import InteractionController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/:postId/like', AuthMiddleware.authenticate, InteractionController.like);
router.post('/:postId/comment', AuthMiddleware.authenticate, InteractionController.comment);
router.get('/:postId/comments', InteractionController.comments);

export default router;
