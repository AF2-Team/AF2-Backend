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

        const existingFavorite = await (favoriteRepo as any).findFavorite(userId, postId);

        if (existingFavorite) {
            // Si ya existe y está activo, retornamos
            if (existingFavorite.status === 1) {
                return { favorited: true, alreadyFavorited: true };
            }
            
            // Si existe pero no está activo (status 0 u otro), lo reactivamos
            await (favoriteRepo as any).reactivate(existingFavorite._id);
        } else {
            // Si no existe, lo creamos
            await favoriteRepo.create({
                user: userId,
                post: postId,
                status: 1,
            });
        }

        // In both cases (reactivation or creation), increment the counter and notify.
        await postRepo.update(postId, { $inc: { favoritesCount: 1 } });

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
            // Use atomic operation to prevent race conditions
            await postRepo.update(postId, { $inc: { favoritesCount: -1 } });
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
