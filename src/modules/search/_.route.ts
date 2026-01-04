import { Router } from 'express';
import SearchController from './_.controller.js';

const router = Router();

router.get('/', SearchController.search);

export default router;
