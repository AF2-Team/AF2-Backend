import { Router } from 'express';
import UserController from './user.controller.js';

const router = Router();

router.get('/:userId/following', UserController.following);
router.get('/:userId/followers', UserController.followers);
router.get('/:userId/profile', UserController.profile);

export default router;
