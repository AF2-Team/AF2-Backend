import { Router } from 'express';
import SocialController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

//Likes and comments
router.post('/:postId/like', AuthMiddleware.authenticate, SocialController.like);
router.post('/:postId/comment', AuthMiddleware.authenticate, SocialController.comment);
router.get('/:postId/comments', SocialController.comments);

//Follow and unfollow
router.post('/', AuthMiddleware.authenticate, SocialController.follow);
router.delete('/',  AuthMiddleware.authenticate, SocialController.unfollow);

//Favorites
router.post('/:postId',AuthMiddleware.authenticate, SocialController.addFavorite);
router.delete('/:postId', AuthMiddleware.authenticate,SocialController.removeFavorite);
router.get('/user/:userId', AuthMiddleware.authenticate, SocialController.listFavorites);

export default router;