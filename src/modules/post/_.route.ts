import { Router } from 'express';
import PostController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';
import { UploadMiddleware } from '@middlewares/upload.middleware.js';

const router = Router();

router.get('/feed/combined', AuthMiddleware.authenticate, PostController.combinedFeed);
router.get('/', PostController.feed);

router.get('/tags/trending', PostController.trendingTags);
router.get('/tags/:name/posts', PostController.postsByTag);
router.get('/tags/:name', PostController.tagInfo);

router.get('/user/:userId', PostController.byUser);
router.get('/tag/:tag', PostController.byTag);

router.post('/', AuthMiddleware.authenticate, UploadMiddleware.memory.array('media', 3), PostController.create);
router.get('/:id', PostController.getById);
router.put('/:id', AuthMiddleware.authenticate, PostController.update);
router.delete('/:id', AuthMiddleware.authenticate, PostController.delete);

router.post(
    '/:id/media',
    AuthMiddleware.authenticate,
    UploadMiddleware.memory.single('media'),
    PostController.uploadMedia,
);

router.post('/:id/repost', AuthMiddleware.authenticate, PostController.repost);
router.get('/:id/reposts', PostController.reposts);
router.get('/:id/likes', PostController.likes);
router.get('/:id/interactions', PostController.interactions);

export default router;
