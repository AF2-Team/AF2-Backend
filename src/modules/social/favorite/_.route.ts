import { Router } from 'express';
import FavoriteController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/posts/:postId', AuthMiddleware.authenticate, FavoriteController.addFavorite);
router.delete('/posts/:postId', AuthMiddleware.authenticate, FavoriteController.removeFavorite);
router.get('/me', AuthMiddleware.authenticate, FavoriteController.getMyFavorites);

export default router;
