import { Router } from 'express';
import GreetingsController from './_.controller.js';

const router = Router();

router.get('/random', GreetingsController.getRandomGreeting);

export default router;
