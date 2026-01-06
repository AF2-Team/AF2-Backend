import { Router } from 'express';
import InteractionController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();


router.post('/like/:postId', AuthMiddleware.authenticate, InteractionController.like);
router.delete('/like/:postId', AuthMiddleware.authenticate, InteractionController.unlike);
router.post('/comment/:postId', AuthMiddleware.authenticate, InteractionController.comment);
router.get('/comment/:postId', InteractionController.comments);

router.post('/repost/:postId', AuthMiddleware.authenticate, InteractionController.repost);

export default router;
