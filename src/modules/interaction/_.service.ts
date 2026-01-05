import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import NotificationService from '../notification/_.service.js';

class InteractionService extends BaseService {
    async likePost(userId: string, postId: string) {
        const interactionRepo = Database.repository('main', 'interaction') as unknown as any;

        const postRepo = Database.repository('main', 'post') as unknown as any;

        const exists = await interactionRepo.exists({
            user: userId,
            post: postId,
            type: 'like',
        });

        if (exists) return { liked: true };

        await interactionRepo.create({
            user: userId,
            post: postId,
            type: 'like',
            status: 1,
        });

        await postRepo.incrementCounters(postId, 'likesCount', 1);

        const post = await postRepo.getById(postId);
        if (post) {
            await NotificationService.notify({
                user: post.user,
                actor: userId,
                type: 'like',
                entityId: postId,
            });
        }

        return { liked: true };
    }

    async commentPost(userId: string, postId: string, text: string) {
        this.validateRequired({ text }, ['text']);

        const interactionRepo = Database.repository('main', 'interaction') as unknown as any;

        const postRepo = Database.repository('main', 'post') as unknown as any;

        const comment = await interactionRepo.create({
            user: userId,
            post: postId,
            type: 'comment',
            text,
            status: 1,
        });

        await postRepo.incrementCounters(postId, 'commentsCount', 1);

        const post = await postRepo.getById(postId);
        if (post) {
            await NotificationService.notify({
                user: post.user,
                actor: userId,
                type: 'comment',
                entityId: postId,
            });
        }

        return comment;
    }

    async getComments(postId: string, options: any) {
        const interactionRepo = Database.repository('main', 'interaction') as unknown as any;

        return interactionRepo.getComments(postId, options);
    }
}

export default new InteractionService();
