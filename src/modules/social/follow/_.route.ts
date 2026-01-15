import { Router } from 'express';
import FollowController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/users/:userId', AuthMiddleware.authenticate, FollowController.followUser);
router.delete('/users/:userId', AuthMiddleware.authenticate, FollowController.unfollowUser);
router.get('/users/:userId/followers', AuthMiddleware.authenticate, FollowController.getFollowers);
router.get('/users/:userId/following', AuthMiddleware.authenticate, FollowController.getFollowings);

router.post('/tags/:tagId', AuthMiddleware.authenticate, FollowController.followTag);
router.delete('/tags/:tagId', AuthMiddleware.authenticate, FollowController.unfollowTag);

export default router;
