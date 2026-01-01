import { Router } from 'express';
import FollowController from './follow.controller.js';

const router = Router();

router.post('/', FollowController.follow);
router.delete('/', FollowController.unfollow);

export default router;
