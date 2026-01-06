import { Router } from 'express';
import FavoriteController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/:postId', AuthMiddleware.authenticate, FavoriteController.add);
router.delete('/:postId', AuthMiddleware.authenticate, FavoriteController.remove);
router.get('/me', AuthMiddleware.authenticate, FavoriteController.me);

export default router;
