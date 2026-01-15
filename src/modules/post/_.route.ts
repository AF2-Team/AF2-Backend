import { Router } from 'express';
import PostController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';
import { UploadMiddleware } from '@middlewares/upload.middleware.js';

const router = Router();

// CRUD de Posts
router.post('/', AuthMiddleware.authenticate, UploadMiddleware.memory.array('media', 3), PostController.createPost);
router.get('/:id', PostController.getPost);
router.put('/:id', AuthMiddleware.authenticate, PostController.updatePost);
router.delete('/:id', AuthMiddleware.authenticate, PostController.deletePost);

// Media adicional
router.post(
    '/:id/media',
    AuthMiddleware.authenticate,
    UploadMiddleware.memory.single('media'),
    PostController.uploadPostMedia,
);

// Reposts
router.post('/:id/repost', AuthMiddleware.authenticate, PostController.createRepost);
router.get('/:id/reposts', PostController.getPostReposts);

// Interacciones (solo contadores)
router.get('/:id/interactions', PostController.getPostInteractions);

// Filtros
router.get('/user/:userId', PostController.getPostsByUser);
router.get('/tag/:tag', PostController.getPostsByTag);

// Tags
router.get('/tags/trending', PostController.getTrendingTags);
router.get('/tags/:name', PostController.getTagInfo);

export default router;
