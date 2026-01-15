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
}

export default new FavoriteRepository();
