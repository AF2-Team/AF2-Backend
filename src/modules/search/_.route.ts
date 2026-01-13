import { Router, Request, Response, NextFunction } from 'express';
import SearchController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

// Búsqueda general
router.get('/', SearchController.search);

// Búsquedas específicas
router.get(
    '/users',
    (req: Request, res: Response, next: NextFunction) => {
        req.query.type = 'user';
        next();
    },
    SearchController.search,
);

router.get(
    '/posts',
    (req: Request, res: Response, next: NextFunction) => {
        req.query.type = 'post';
        next();
    },
    SearchController.search,
);

router.get(
    '/tags',
    (req: Request, res: Response, next: NextFunction) => {
        req.query.type = 'tag';
        next();
    },
    SearchController.search,
);

// Historial
router.get('/history', AuthMiddleware.authenticate, SearchController.getSearchHistory);
router.delete('/history', AuthMiddleware.authenticate, SearchController.clearSearchHistory);

export default router;
