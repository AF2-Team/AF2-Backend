import { Model, Types } from 'mongoose';
import InteractionModel, { InteractionType } from '@database/models/main/interaction.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';
import { DatabaseError } from '@errors/database.error.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class InteractionRepository extends MongooseRepositoryBase<any> {
    constructor() {
        super(InteractionModel);
    }

    async exists(filter: { 
        user: string; 
        post: string; 
        type: InteractionType 
    }): Promise<boolean> {
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
        return this.executeWithLogging('getRepostsByUsers', async () => {
            const filter = {
                user: { $in: userIds.map(id => new Types.ObjectId(id)) },
                type: 'repost',
                status: 1,
            };
            
            return this.getAll(options, filter);
        });
    }

    async getLikes(postId: string, options: ProcessedQueryFilters) {
        return this.getAllActive(options, {
            post: postId,
            type: 'like',
        });
    }

    async countByType(postId: string, type: InteractionType): Promise<number> {
        return this.executeWithLogging('countByType', async () => {
            const count = await this.model.countDocuments({
                post: new Types.ObjectId(postId),
                type,
                status: 1,
            });
            return count;
        });
    }

    async removeInteraction(userId: string, postId: string, type: InteractionType): Promise<boolean> {
        const deletedCount = await this.remove(
            {
                user: new Types.ObjectId(userId),
                post: new Types.ObjectId(postId),
                type,
            },
            { single: true }
        );

        return deletedCount > 0;
    }
}

export { InteractionRepository };
