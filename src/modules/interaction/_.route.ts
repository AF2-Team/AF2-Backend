import { Router } from 'express';
import InteractionController from './interaction.controller.js';

const router = Router();

router.post('/:postId/like', InteractionController.like);
router.post('/:postId/comment', InteractionController.comment);
router.get('/:postId/comments', InteractionController.comments);

export default router;
