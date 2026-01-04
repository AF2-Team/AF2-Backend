import { Router } from 'express';
import PostController from './post.controller.js';

const router = Router();

router.post('/', PostController.create);
router.post('/:postId/repost', PostController.repost);

router.get('/', PostController.feed);
router.get('/feed/combined', PostController.combinedFeed);
router.get('/user/:userId', PostController.byUser);
router.get('/tag/:tag', PostController.byTag);

export default router;
