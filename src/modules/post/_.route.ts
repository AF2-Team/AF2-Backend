import { Router } from 'express';
import PostController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';
import { UploadMiddleware } from '@middlewares/upload.middleware.js';
import InteractionController from '@modules/social/interaction/_.controller.js';
const router = Router();

// CRUD de Posts
router.post('/', AuthMiddleware.authenticate, UploadMiddleware.memory.array('media', 3), PostController.createPost);
router.get('/:id', PostController.getPost);
router.put('/:id', AuthMiddleware.authenticate, PostController.updatePost);
router.delete('/:id', AuthMiddleware.authenticate, PostController.deletePost);
router.get('/', AuthMiddleware.authenticate, PostController.getFeed);
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
router.post('/:postId/like', AuthMiddleware.authenticate, InteractionController.toggleLike);
router.post('/:id/comment', AuthMiddleware.authenticate, PostController.addComment);
router.get('/:id/comments', AuthMiddleware.authenticate, PostController.getComments);
// Filtros
router.get('/user/:userId', PostController.getPostsByUser);
router.get('/tag/:tag', PostController.getPostsByTag);

// Tags
router.get('/tags/trending', PostController.getTrendingTags);
router.get('/tags/:name', PostController.getTagInfo);

export default router;
