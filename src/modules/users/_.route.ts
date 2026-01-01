import { Router } from 'express';
import UserController from './_.controller.js';

const router = Router();

router.post('/', UserController.create); // POST /api/v1/users
router.get('/', UserController.list);    // GET /api/v1/users

export default router;