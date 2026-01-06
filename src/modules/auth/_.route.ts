import { Router } from 'express';
import AuthController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

router.get('/me', AuthMiddleware.authenticate, AuthController.me);
router.post('/logout', AuthMiddleware.authenticate, AuthController.logout);

export default router;
