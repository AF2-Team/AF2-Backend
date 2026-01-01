import FavoriteModel from '@database/models/main/favorite.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';
import { DatabaseError } from '@errors/database.error.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class FavoriteRepository extends MongooseRepositoryBase<any> {
    constructor() {
        super(FavoriteModel);
    }

    async exists(userId: string, postId: string): Promise<boolean> {
        return this.executeWithLogging('exists', async () => {
            try {
                const result = await this.model.exists({
                    user: userId,
                    post: postId,
                    status: 1,
                });

                return !!result;
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose exists failed',
                    'exists',
                    { userId, postId, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async deleteFavorite(userId: string, postId: string): Promise<boolean> {
        return this.executeWithLogging('deleteFavorite', async () => {
            try {
                const result = await this.model.deleteOne({
                    user: userId,
                    post: postId,
                });

                return (result.deletedCount ?? 0) > 0;
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose deleteFavorite failed',
                    'deleteFavorite',
                    { userId, postId, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async getFavorites(userId: string, options: ProcessedQueryFilters) {
        return this.getAllActive(options, { user: userId });
    }
}

export default new FavoriteRepository();
