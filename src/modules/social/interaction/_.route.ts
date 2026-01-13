import { Router } from 'express';
import InteractionController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

// Likes
router.post('/posts/:postId/like', AuthMiddleware.authenticate, InteractionController.likePost);
router.delete('/posts/:postId/like', AuthMiddleware.authenticate, InteractionController.unlikePost);
// Comments
router.post('/posts/:postId/comments', AuthMiddleware.authenticate, InteractionController.createComment);
router.get('/posts/:postId/comments', InteractionController.getComments);

export default router;
