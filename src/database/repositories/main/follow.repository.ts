import FollowModel from '@database/models/main/follow.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';
import { DatabaseError } from '@errors/database.error.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';
import mongoose from 'mongoose';

class FollowRepository extends MongooseRepositoryBase<any> {
    constructor() {
        super(FollowModel);
    }

    async exists(filter: { followerId: string; targetId: string; targetType: 'user' | 'tag' }): Promise<boolean> {
        return this.executeWithLogging('exists', async () => {
            try {
                const result = await this.model.exists({
                    follower: filter.followerId,
                    target: filter.targetId,
                    targetType: filter.targetType,
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

    async deleteFollow(filter: { followerId: string; targetId: string; targetType: 'user' | 'tag' }): Promise<boolean> {
        const deletedCount = await this.remove(
            {
                follower: filter.followerId,
                target: filter.targetId,
                targetType: filter.targetType,
            },
            { single: true },
        );

        return deletedCount > 0;
    }

    async getFollowing(userId: string, options: ProcessedQueryFilters) {
        return this.executeWithLogging('getFollowing', async () => {
            try {
                const pipeline: any[] = [
                    {
                        $match: {
                            follower: new mongoose.Types.ObjectId(userId),
                            targetType: 'user',
                            status: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'target',
                            foreignField: '_id',
                            as: 'user',
                        },
                    },
                    { $unwind: '$user' },
                    {
                        $match: {
                            'user.status': 1,
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            user: {
                                id: '$user._id',
                                name: '$user.name',
                                email: '$user.email',
                            },
                        },
                    },
                ];

                if (options.order?.length) {
                    const sort: any = {};
                    options.order.forEach(([field, dir]) => {
                        sort[`user.${field}`] = dir === 'asc' ? 1 : -1;
                    });
                    pipeline.push({ $sort: sort });
                }

                if (options.pagination) {
                    pipeline.push({ $skip: options.pagination.offset });

                    if (options.pagination.limit && options.pagination.limit > 0)
                        pipeline.push({ $limit: options.pagination.limit });
                }

                const result = await this.model.aggregate(pipeline).exec();
                return result.map((r: any) => r.user);
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose getFollowing failed',
                    'getFollowing',
                    { userId, options, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async getFollowers(userId: string, options: ProcessedQueryFilters) {
        return this.executeWithLogging('getFollowers', async () => {
            try {
                const pipeline: any[] = [
                    {
                        $match: {
                            target: new mongoose.Types.ObjectId(userId),
                            targetType: 'user',
                            status: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'follower',
                            foreignField: '_id',
                            as: 'user',
                        },
                    },
                    { $unwind: '$user' },
                    {
                        $match: {
                            'user.status': 1,
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            user: {
                                id: '$user._id',
                                name: '$user.name',
                                email: '$user.email',
                            },
                        },
                    },
                ];

                if (options.order?.length) {
                    const sort: any = {};
                    options.order.forEach(([field, dir]) => {
                        sort[`user.${field}`] = dir === 'asc' ? 1 : -1;
                    });
                    pipeline.push({ $sort: sort });
                }

                if (options.pagination) {
                    pipeline.push({ $skip: options.pagination.offset });

                    if (options.pagination.limit && options.pagination.limit > 0)
                        pipeline.push({ $limit: options.pagination.limit });
                }

                const result = await this.model.aggregate(pipeline).exec();
                return result.map((r: any) => r.user);
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose getFollowers failed',
                    'getFollowers',
                    { userId, options, error: error.message },
                    { cause: error },
                );
            }
        });
    }
}

export default new FollowRepository();
