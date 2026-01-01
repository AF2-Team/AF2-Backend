import InteractionModel, { InteractionType } from '@database/models/main/interaction.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';
import { DatabaseError } from '@errors/database.error.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class InteractionRepository extends MongooseRepositoryBase<any> {
    constructor() {
        super(InteractionModel);
    }

    async exists(filter: { user: string; post: string; type: InteractionType }): Promise<boolean> {
        return this.executeWithLogging('exists', async () => {
            try {
                const result = await this.model.exists({
                    ...filter,
                    status: 1,
                });

                return !!result;
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose exists failed',
                    'exists',
                    { filter, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async getComments(postId: string, options: ProcessedQueryFilters) {
        return this.getAllActive(options, {
            post: postId,
            type: 'comment',
        });
    }

    async getRepostsByUsers(userIds: string[], options: ProcessedQueryFilters) {
        return this.getAll(
            {
                ...options,
                order: [['createdAt', 'desc']],
            },
            {
                user: { $in: userIds },
                type: 'repost',
                status: 1,
            },
        );
    }
}

export default new InteractionRepository();
