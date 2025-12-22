import { Router } from 'express';
import { GreetingsController } from './_.controller.js';

const router = Router();

router.get('/random', GreetingsController.getRandomGreeting);
// Rutas para testing de errores
router.get('/test/error', GreetingsController.triggerError);
router.get('/test/app-error', GreetingsController.triggerAppError);

export default router;
