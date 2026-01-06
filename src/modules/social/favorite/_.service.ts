import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';

class FavoriteService extends BaseService {
    async add(userId: string, postId: string) {
        this.validateRequired({ userId, postId }, ['userId', 'postId']);

        const repo = Database.repository('main', 'favorite');

        const exists = await repo.getOne({
            user: userId,
            post: postId,
            status: 1,
        });

        if (exists) return { favorited: true };

        await repo.create({
            user: userId,
            post: postId,
            status: 1,
        });

        return { favorited: true };
    }

    async remove(userId: string, postId: string) {
        this.validateRequired({ userId, postId }, ['userId', 'postId']);

        const repo = Database.repository('main', 'favorite');

        const favorite = await repo.getOne({
            user: userId,
            post: postId,
            status: 1,
        });

        if (!favorite) return { unfavorited: false };

        await repo.update(favorite._id.toString(), { status: 0 });

        return { unfavorited: true };
    }

    async list(userId: string, options: any) {
        this.validateRequired({ userId }, ['userId']);

        const repo = Database.repository('main', 'favorite');

        return repo.getAllActive(options, {
            user: userId,
            status: 1,
        });
    }
}

export default new FavoriteService();
