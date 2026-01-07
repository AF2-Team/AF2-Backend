import { Router } from 'express';
import PostController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';
import { UploadMiddleware } from '@middlewares/upload.middleware.js';

const router = Router();

router.post('/', AuthMiddleware.authenticate, PostController.create);
router.get('/:id', PostController.getById);
router.put('/:id', AuthMiddleware.authenticate, PostController.update);
router.delete('/:id', AuthMiddleware.authenticate, PostController.delete);

router.post('/:id/media', AuthMiddleware.authenticate, UploadMiddleware.single('media'), PostController.uploadMedia);

router.post('/:id/repost', AuthMiddleware.authenticate, PostController.repost);
router.get('/:id/reposts', PostController.reposts);

router.get('/:id/likes', PostController.likes);
router.get('/:id/interactions', PostController.interactions);

router.get('/', PostController.feed);
router.get('/feed/combined', AuthMiddleware.authenticate, PostController.combinedFeed);
router.get('/user/:userId', PostController.byUser);
router.get('/tag/:tag', PostController.byTag);

router.get('/tags/trending', PostController.trendingTags);
router.get('/tags/:name', PostController.tagInfo);
router.get('/tags/:name/posts', PostController.postsByTag);

export default router;
