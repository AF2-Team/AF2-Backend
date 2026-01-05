import { Router } from 'express';
import SocialController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/:postId/like', AuthMiddleware.authenticate, SocialController.like);
router.post('/:postId/comment', AuthMiddleware.authenticate, SocialController.comment);
router.get('/:postId/comments', SocialController.comments);
router.post('/', AuthMiddleware.authenticate, SocialController.follow);
router.delete('/',  AuthMiddleware.authenticate, SocialController.unfollow);

export default router;