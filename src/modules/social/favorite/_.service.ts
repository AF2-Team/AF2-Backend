import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ValidationError, NotFoundError } from '@errors';
import NotificationService from '@modules/social/notification/_.service.js';

class FavoriteService extends BaseService {
    private getFavoriteRepo() {
        return Database.repository('main', 'favorite');
    }

    private getPostRepo() {
        return Database.repository('main', 'post');
    }

    async addFavorite(userId: string | undefined, postId: string) {
        this.validateRequired({ userId, postId }, ['userId', 'postId']);

        const favoriteRepo = this.getFavoriteRepo();
        const postRepo = this.getPostRepo();

        const post = await postRepo.getById(postId);
        if (!post || post.status !== 1) {
            throw new NotFoundError('Post', postId);
        }

        const exists = await favoriteRepo.getOne({
            user: userId,
            post: postId,
            status: 1,
        });

        if (exists) {
            return { favorited: true, alreadyFavorited: true };
        }

        await favoriteRepo.create({
            user: userId,
            post: postId,
            status: 1,
        });

        await postRepo.update(postId, {
            favoritesCount: (post.favoritesCount || 0) + 1,
        });

        if (userId && post.user.toString() !== userId) {
            await NotificationService.notify({
                user: post.user.toString(),
                actor: userId,
                type: 'favorite',
                entityId: postId,
            });
        }

        return { favorited: true };
    }

    async removeFavorite(userId: string | undefined, postId: string) {
        this.validateRequired({ userId, postId }, ['userId', 'postId']);

        const favoriteRepo = this.getFavoriteRepo();
        const postRepo = this.getPostRepo();

        const favorite = await favoriteRepo.getOne({
            user: userId,
            post: postId,
            status: 1,
        });

        if (!favorite) {
            return { unfavorited: false, notFavorited: true };
        }

        await favoriteRepo.update(favorite._id.toString(), { status: 0 });

        const post = await postRepo.getById(postId);
        if (post) {
            await postRepo.update(postId, {
                favoritesCount: Math.max(0, (post.favoritesCount || 0) - 1),
            });
        }

        return { unfavorited: true };
    }

    async getMyFavorites(userId: string | undefined, options: any) {
        this.validateRequired({ userId }, ['userId']);

        const favoriteRepo = this.getFavoriteRepo();
        return favoriteRepo.getAllActive(options, {
            user: userId,
            status: 1,
        });
    }
}

export default new FavoriteService();
