import { Router } from 'express';
import followRoute from './follow/_.route.js';
//import interactionRoute from './interaction/_.route.js';
import favoriteRoute from './favorite/_.route.js';
import notificationRoute from './notification/_.route.js';

const router = Router();

router.use('/follow', followRoute);
//router.use('/interaction', interactionRoute);
router.use('/favorite', favoriteRoute);
router.use('/notification', notificationRoute);

export default router;
