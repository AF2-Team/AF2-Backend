import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';

class FavoriteService extends BaseService {
    async add(userId: string, postId: string) {
        this.validateRequired({ userId, postId }, ['userId', 'postId']);

        const favoriteRepo = Database.repository('main', 'favorite') as any;
        const postRepo = Database.repository('main', 'post') as any;

        const exists = await favoriteRepo.exists(userId, postId);
        if (exists) return { favorited: true };

        await favoriteRepo.create({
            user: userId,
            post: postId,
            status: 1,
        });

        await postRepo.incrementCounters(postId, 'favoritesCount', 1);

        return { favorited: true };
    }

    async remove(userId: string, postId: string) {
        this.validateRequired({ userId, postId }, ['userId', 'postId']);

        const favoriteRepo = Database.repository('main', 'favorite') as any;
        const postRepo = Database.repository('main', 'post') as any;

        const removed = await favoriteRepo.deleteFavorite(userId, postId);
        if (!removed) return { unfavorited: false };

        await postRepo.incrementCounters(postId, 'favoritesCount', -1);

        return { unfavorited: true };
    }

    async list(userId: string, options: any) {
        this.validateRequired({ userId }, ['userId']);

        const favoriteRepo = Database.repository('main', 'favorite') as any;
        return favoriteRepo.getFavorites(userId, options);
    }
}

export default new FavoriteService();
