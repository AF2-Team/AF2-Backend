import { Router } from 'express';
import UserController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';
import { UploadMiddleware } from '@middlewares/upload.middleware.js';

const router = Router();

router.get('/me', AuthMiddleware.authenticate, UserController.getMe);
router.get('/username/:username', AuthMiddleware.authenticate, UserController.getByUsername);

// Perfil propio
router.patch('/me', AuthMiddleware.authenticate, UserController.updateMe);
router.delete('/me', AuthMiddleware.authenticate, UserController.deleteMe);

router.patch(
    '/me/avatar',
    UploadMiddleware.memory.single('media'),
    AuthMiddleware.authenticate,
    UserController.uploadAvatar,
);
router.patch(
    '/me/cover',
    UploadMiddleware.memory.single('media'),
    AuthMiddleware.authenticate,
    UserController.uploadCover,
);

router.get('/:id', AuthMiddleware.authenticate, UserController.getById);
router.get('/:id/posts', UserController.posts);
router.get('/:id/reposts', UserController.reposts);
router.get('/:id/favorites', UserController.favorites);

// Social
router.get('/me/following', AuthMiddleware.authenticate, UserController.following);
router.get('/me/followers', AuthMiddleware.authenticate, UserController.followers);

export default router;
