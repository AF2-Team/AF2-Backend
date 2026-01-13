import { Router } from 'express';
import PostController from './_.controller.js';
import { AuthMiddleware } from '@middlewares/auth.middleware.js';
import { UploadMiddleware } from '@middlewares/upload.middleware.js';

const router = Router();

// --- RUTAS GLOBALES ---

// Crear Post (POST /) -> Llama a PostController.create
router.post(
    '/', 
    AuthMiddleware.authenticate, 
    UploadMiddleware.memory.array('media', 5), // Corregido para usar array
    PostController.create
);

// Feed General (GET /)
router.get('/', PostController.feed);

// Feed Combinado (GET /feed)
router.get('/feed', AuthMiddleware.authenticate, PostController.combinedFeed);

// --- FILTROS Y TAGS ---
router.get('/user/:userId', PostController.byUser);
router.get('/tag/:tag', PostController.byTag);
router.get('/tags/trending', PostController.trendingTags);
router.get('/tags/:name', PostController.tagInfo);

// --- ACCIONES SOBRE POST (ID) ---
// Importante: Rutas con :id van al final

// Subir media extra
router.post(
    '/:id/media',
    AuthMiddleware.authenticate,
    UploadMiddleware.memory.single('media'),
    PostController.uploadMedia
);

// Repost
router.post('/:id/repost', AuthMiddleware.authenticate, PostController.repost);
router.get('/:id/reposts', PostController.reposts);

// Interacciones
router.get('/:id/likes', PostController.likes);
router.get('/:id/interactions', PostController.interactions);

// CRUD Básico
router.get('/:id', PostController.getById); // Llama a getById
router.patch('/:id', AuthMiddleware.authenticate, PostController.update); // Llama a update
router.delete('/:id', AuthMiddleware.authenticate, PostController.delete); // Llama a delete

export default router;