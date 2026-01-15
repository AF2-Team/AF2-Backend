import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ValidationError, NotFoundError } from '@errors';
import NotificationService from '@modules/social/notification/_.service.js';

class InteractionService extends BaseService {
    private getInteractionRepo() {
        return Database.repository('main', 'interaction');
    }

    private getPostRepo() {
        return Database.repository('main', 'post');
    }

    private getUserRepo() {
        return Database.repository('main', 'user');
    }
   // --- CORRECCIÓN 1: TOGGLE INTELIGENTE ---
    async toggleLike(userId: string, postId: string) {
        const interactionRepo = this.getInteractionRepo();
        
        // [CLAVE] Buscamos interacción existente IGNORANDO el status
        // Así encontramos si ya le dio like antes (aunque ahora sea status 0)
        const existing = await interactionRepo.getOne({
            user: userId,
            post: postId,
            type: 'like'
        });

        let isLiked = false;

        if (existing) {
            if (existing.status === 1) {
                // Si existe y está activo -> Quitamos like
                await this.unlikePost(userId, postId);
                isLiked = false;
            } else {
                // Si existe pero está inactivo (0) -> Reactivamos
                await this.likePost(userId, postId);
                isLiked = true;
            }
        } else {
            // Si NO existe registro alguno -> Creamos uno nuevo
            await this.likePost(userId, postId);
            isLiked = true;
        }

        const post = await this.getPostRepo().getById(postId);
        return {
            liked: isLiked,
            likesCount: post?.likesCount || 0
        };
    }

    // --- CORRECCIÓN 2: REACTIVAR EN LUGAR DE DUPLICAR ---
    async likePost(userId: string, postId: string) {
        this.validateRequired({ userId, postId }, ['userId', 'postId']);

        const interactionRepo = this.getInteractionRepo();
        const postRepo = this.getPostRepo();

        const post = await postRepo.getById(postId);
        if (!post || post.status !== 1) {
            throw new NotFoundError('Post', postId);
        }

        // [CLAVE] Buscamos SIN filtrar por status
        const existing = await interactionRepo.getOne({
            user: userId,
            post: postId,
            type: 'like',
        });

        // CASO A: YA EXISTE EL REGISTRO
        if (existing) {
            if (existing.status === 1) {
                return { liked: true, alreadyLiked: true };
            } else {
                // ESTABA BORRADO (Status 0) -> LO REACTIVAMOS A 1
                await interactionRepo.update(existing._id.toString(), { status: 1 });
                
                await postRepo.update(postId, { likesCount: (post.likesCount || 0) + 1 });
                
                if (post.user.toString() !== userId) this.sendNotify(post, userId, postId);
                
                return { liked: true };
            }
        }

        // CASO B: NO EXISTE REGISTRO -> CREAMOS UNO NUEVO
        // Solo llegamos aquí si de verdad es la primera vez
        await interactionRepo.create({
            user: userId,
            post: postId,
            type: 'like',
            status: 1,
        });

        await postRepo.update(postId, { likesCount: (post.likesCount || 0) + 1 });

        if (post.user.toString() !== userId) this.sendNotify(post, userId, postId);

        return { liked: true };
    }

    async unlikePost(userId: string, postId: string) {
        this.validateRequired({ userId, postId }, ['userId', 'postId']);
        const interactionRepo = this.getInteractionRepo();
        const postRepo = this.getPostRepo();

        // Para borrar sí buscamos el activo
        const like = await interactionRepo.getOne({
            user: userId, post: postId, type: 'like', status: 1,
        });

        if (!like) return { unliked: false, notLiked: true };

        // Soft Delete (Status 0)
        await interactionRepo.update(like._id.toString(), { status: 0 });

        const post = await postRepo.getById(postId);
        if (post) {
            await postRepo.update(postId, {
                likesCount: Math.max(0, (post.likesCount || 0) - 1),
            });
        }
        return { unliked: true };
    }

    private async sendNotify(post: any, userId: string, postId: string) {
        try {
            await NotificationService.notify({
                user: post.user.toString(),
                actor: userId,
                type: 'like',
                entityId: postId,
                entityModel: 'Post',
            });
        } catch (error) { console.error('Notif Error:', error); }
    }

    async createComment(userId: string, postId: string, text: string) {
        this.validateRequired({ userId, postId, text }, ['userId', 'postId', 'text']);

        if (text === undefined || text === null) {
            throw new ValidationError('Text field is required');
        }

        if (typeof text !== 'string') {
            throw new ValidationError('Comment text must be a string');
        }

        const trimmedText = text.trim();

        if (trimmedText.length === 0) {
            throw new ValidationError('Comment text cannot be empty');
        }

        if (trimmedText.length > 1000) {
            throw new ValidationError('Comment cannot exceed 1000 characters');
        }

        const interactionRepo = this.getInteractionRepo();
        const postRepo = this.getPostRepo();

        const post = await postRepo.getById(postId);
        if (!post || post.status !== 1) {
            throw new NotFoundError('Post', postId);
        }

        const comment = await interactionRepo.create({
            user: userId,
            post: postId,
            type: 'comment',
            text: trimmedText,
            status: 1,
        });

        await postRepo.update(postId, {
            commentsCount: (post.commentsCount || 0) + 1,
        });

        if (post.user.toString() !== userId) {
            try {
                await NotificationService.notify({
                    user: post.user.toString(),
                    actor: userId,
                    type: 'comment',
                    entityId: comment._id.toString(),
                    entityModel: 'Interaction',
                });
            } catch (error) {
                console.error('Failed to send comment notification:', error);
            }
        }
        if (comment.populate) {
        await comment.populate('user', 'name username avatarUrl');
    }

        return comment;
    }

    async getComments(postId: string, options: any) {
        this.validateRequired({ postId }, ['postId']);

        const interactionRepo = this.getInteractionRepo();

        const postRepo = this.getPostRepo();
        const post = await postRepo.getById(postId);
        if (!post) {
            throw new NotFoundError('Post', postId);
        }

        const result = await interactionRepo.getAllActive(options, {
            post: postId,
            type: 'comment',
            status: 1,
        });

      if (result.length > 0) {
    const repo = interactionRepo as any;
    if (repo.model) {
        await repo.model.populate(result, { 
            path: 'user', 
            select: 'name username avatarUrl' 
        });
    }
}

        return result;
    }

    async getPostLikes(postId: string, options: any) {
        this.validateRequired({ postId }, ['postId']);

        const interactionRepo = this.getInteractionRepo();
        const userRepo = this.getUserRepo();
        const postRepo = this.getPostRepo();

        const post = await postRepo.getById(postId);
        if (!post) {
            throw new NotFoundError('Post', postId);
        }

        const likes = await interactionRepo.getAllActive(options, {
            post: postId,
            type: 'like',
            status: 1,
        });

        const userIds = likes.map((like: any) => like.user).filter(Boolean);

        if (userIds.length === 0) {
            return [];
        }

        const users = await userRepo.getAllActive(
            {
                pagination: { limit: options.pagination?.limit || 20 },
            },
            {
                _id: { $in: userIds },
                status: 1,
            },
        );

        const userMap = new Map();
        likes.forEach((like: any) => {
            userMap.set(like.user.toString(), like.createdAt);
        });

        return users.sort((a: any, b: any) => {
            const dateA = userMap.get(a._id.toString()) || new Date(0);
            const dateB = userMap.get(b._id.toString()) || new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
    }
}

export default new InteractionService();
