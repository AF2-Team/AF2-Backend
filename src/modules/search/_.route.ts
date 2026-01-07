import { Router } from 'express';
import SearchController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', SearchController.search);

router.get('/users', (req, res) => {
    req.query.type = 'user';
    return SearchController.search(req, res);
});

router.get('/posts', (req, res) => {
    req.query.type = 'post';
    return SearchController.search(req, res);
});

router.get('/tags', (req, res) => {
    req.query.type = 'tag';
    return SearchController.search(req, res);
});

// History
router.get('/history', AuthMiddleware.authenticate, SearchController.history);
router.delete('/history', AuthMiddleware.authenticate, SearchController.clearHistory);

export default router;
