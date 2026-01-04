import { Router } from 'express';
import FeedController from './feed.controller.js';

const router = Router();

router.get('/', FeedController.get);

export default router;
