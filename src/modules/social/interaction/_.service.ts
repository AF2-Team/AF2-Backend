import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError } from '@errors';
// Asegúrate de que esta ruta sea exacta y el archivo exista
import NotificationService from '@modules/social/notification/_.service.js';
// Importamos el repositorio (asumiendo que es la instancia por defecto)
import postRepositoryInstance from '@database/repositories/main/post.repository.js';

class InteractionService extends BaseService {

    private get interactionRepo() {
        return Database.repository('main', 'interaction');
    }

    private get postRepo() {
        // Usamos directamente la instancia importada para el tipado si es posible,
        // o hacemos el cast al tipo del repositorio.
        return Database.repository('main', 'post') as unknown as typeof postRepositoryInstance;
    }

    async toggleLike(userId: string, postId: string) {
        // 1. Validar Post
        const post = await this.postRepo.getById(postId);
        
        // Comprobamos existencia y estatus (usando casting temporal si TS da error)
        if (!post || (post as any).status !== 1) {
            throw new NotFoundError('Post', postId);
        }

        // 2. Buscar Interacción Previa
        const existing = await this.interactionRepo.getOne({
            user: userId,
            post: postId,
            type: 'like'
        });

        let isLiked = false;

        if (existing) {
            // El status del "like" suele ser 1 activo, 0 inactivo
            if (existing.status === 1) {
                await this.interactionRepo.update(existing._id, { status: 0 });
                await this.postRepo.updateLikesCount(postId, -1);
                isLiked = false;
            } else {
                await this.interactionRepo.update(existing._id, { status: 1 });
                await this.postRepo.updateLikesCount(postId, 1);
                isLiked = true;
            }
        } else {
            // LIKE NUEVO
            await this.interactionRepo.create({
                user: userId,
                post: postId,
                type: 'like',
                status: 1
            });
            
            await this.postRepo.updateLikesCount(postId, 1);
            isLiked = true;

            // Notificación (solo si el que da like no es el dueño del post)
            // Usamos post.user?.toString() para evitar errores si user es null
            const postOwnerId = (post as any).user?.toString();
            
            if (postOwnerId && postOwnerId !== userId) {
                // Envolvemos en try/catch para que un error en notificaciones no rompa el like
                NotificationService.notify({
                    user: postOwnerId,
                    actor: userId,
                    type: 'like',
                    entityId: postId
                }).catch(e => console.error('Error sending notification:', e));
            }
        }

        // 3. Retornar estado actualizado
        const updatedPost = await this.postRepo.getById(postId);

        return {
            liked: isLiked,
            likesCount: (updatedPost as any)?.likesCount || 0
        };
    }
}

export default new InteractionService();