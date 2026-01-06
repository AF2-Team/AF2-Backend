import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ValidationError } from '@errors';

class InteractionService extends BaseService {
    async like(userId: string, postId: string) {
        const repo = Database.repository('main', 'interaction');

        const exists = await repo.getOne({
            user: userId,
            post: postId,
            type: 'like',
            status: 1,
        });

        if (exists) return { liked: true };

        await repo.create({
            user: userId,
            post: postId,
            type: 'like',
            status: 1,
        });

        return { liked: true };
    }

    async unlike(userId: string, postId: string) {
        const repo = Database.repository('main', 'interaction');

        const like = await repo.getOne({
            user: userId,
            post: postId,
            type: 'like',
            status: 1,
        });

        if (!like) return { unliked: false };

        await repo.update(like._id.toString(), { status: 0 });
        return { unliked: true };
    }

    async comment(userId: string, postId: string, text: string) {
        this.validateRequired({ text }, ['text']);

        const repo = Database.repository('main', 'interaction');

        return repo.create({
            user: userId,
            post: postId,
            type: 'comment',
            text,
            status: 1,
        });
    }

    async getComments(postId: string, options: any) {
        const repo = Database.repository('main', 'interaction');

        return repo.getAllActive(options, {
            post: postId,
            type: 'comment',
            status: 1,
        });
    }

    async repost(userId: string, postId: string) {
        const repo = Database.repository('main', 'interaction');

        const exists = await repo.getOne({
            user: userId,
            post: postId,
            type: 'repost',
            status: 1,
        });

        if (exists) return { reposted: true };

        await repo.create({
            user: userId,
            post: postId,
            type: 'repost',
            status: 1,
        });

        return { reposted: true };
    }
}

export default new InteractionService();
