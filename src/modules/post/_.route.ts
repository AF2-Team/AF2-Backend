import { Router } from 'express';
import PostController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

//router.use(AuthMiddleware.authenticate);

router.post('/', PostController.create);
router.post('/:postId/repost', PostController.repost);

router.get('/', PostController.feed);
router.get('/feed/combined', PostController.combinedFeed);
router.get('/user/:userId', PostController.byUser);
router.get('/tag/:tag', PostController.byTag);


//router.patch('/:postId', PostController.update);
//router.delete('/:postId', PostController.delete);

export default router;
