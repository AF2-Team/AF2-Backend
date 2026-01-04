import { Router } from 'express';
import FeedController from './_.controller.js';

const router = Router();

router.get('/', FeedController.get);

export default router;
