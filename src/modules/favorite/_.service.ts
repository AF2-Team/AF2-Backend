import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';

class FavoriteService extends BaseService {
    async add(userId: string, postId: string) {
        const favoriteRepo = Database.repository('main', 'favorite');
        const postRepo = Database.repository('main', 'post');

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
        const favoriteRepo = Database.repository('main', 'favorite');
        const postRepo = Database.repository('main', 'post');

        const deleted = await favoriteRepo.deleteFavorite(userId, postId);
        if (!deleted) return { unfavorited: false };

        await postRepo.incrementCounters(postId, 'favoritesCount', -1);

        return { unfavorited: true };
    }

    async list(userId: string, options: any) {
        const favoriteRepo = Database.repository('main', 'favorite');
        return await favoriteRepo.getFavorites(userId, options);
    }
}

export default new FavoriteService();
