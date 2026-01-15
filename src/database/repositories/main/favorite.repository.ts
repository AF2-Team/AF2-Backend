import FavoriteModel from '@database/models/main/favorite.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class FavoriteRepository extends MongooseRepositoryBase<typeof FavoriteModel> {
    constructor() {
        super(FavoriteModel);
    }

    async exists(userId: string, postId: string): Promise<boolean> {
        const result = await this.model.exists({
            user: userId,
            post: postId,
            status: 1,
        });

        return !!result;
    }

    async remove(userId: string, postId: string): Promise<boolean> {
        const result = await this.model.deleteOne({
            user: userId,
            post: postId,
        });

        return (result.deletedCount ?? 0) > 0;
    }

    async getByUser(userId: string, options: any = {}) {
        return this.getAll(options, {
            user: userId,
            status: 1,
        });
    }

    async findFavorite(userId: string, postId: string) {
        return this.model
            .findOne({
                user: userId,
                post: postId,
            })
            .exec();
    }

    async reactivate(id: string) {
        return this.model.findByIdAndUpdate(id, { status: 1 }, { new: true }).exec();
    }

    async getFavoritesWithPosts(userId: string, options: any = {}) {
        const limit = options.pagination?.limit || 10;
        const offset = options.pagination?.offset || 0;

        const favorites = await this.model
            .find({
                user: userId,
                status: 1,
            })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .populate({
                path: 'post',
                populate: { path: 'user', select: 'username name avatar' },
            })
            .lean()
            .exec();

        return favorites.map((fav: any) => {
            if (fav.post) {
                // Estandarizamos el autor para que el frontend lo reciba igual que en el feed
                fav.post.author = fav.post.user;
                fav.post.id = fav.post._id;
            }
            return fav;
        });
    }
}

export default new FavoriteRepository();
