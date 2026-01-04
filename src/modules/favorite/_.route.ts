import { Router } from 'express';
import FavoriteController from './_.controller.js';

const router = Router();

router.post('/:postId', FavoriteController.add);
router.delete('/:postId', FavoriteController.remove);
router.get('/user/:userId', FavoriteController.list);

export default router;
