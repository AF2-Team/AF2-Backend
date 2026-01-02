import { Model, Types } from 'mongoose';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';
import { DatabaseError } from '@errors/database.error.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';
import FollowModel from '@database/models/main/follow.model.js';

class FollowRepository extends MongooseRepositoryBase<any> {
    constructor() {
        super(FollowModel);
    }

    async exists(filter: { 
        followerId: string; 
        targetId: string; 
        targetType: 'user' | 'tag' 
    }): Promise<boolean> {
        return this.executeWithLogging('exists', async () => {
            try {
                const result = await (this.model as Model<any>).exists({
                    follower: new Types.ObjectId(filter.followerId),
                    targetId: new Types.ObjectId(filter.targetId),
                    targetType: filter.targetType,
                    status: 1,
                });

                return !!result;
            } catch (error: any) {
                throw new DatabaseError(
                    'Failed to check follow existence',
                    'exists',
                    { filter, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async deleteFollow(filter: { 
        followerId: string; 
        targetId: string; 
        targetType: 'user' | 'tag' 
    }): Promise<boolean> {
        const deletedCount = await this.remove(
            {
                follower: new Types.ObjectId(filter.followerId),
                targetId: new Types.ObjectId(filter.targetId),
                targetType: filter.targetType,
            },
            { single: true },
        );

        return deletedCount > 0;
    }

    async getFollowingIds(userId: string): Promise<string[]> {
        return this.executeWithLogging('getFollowingIds', async () => {
            try {
                const follows = await (this.model as Model<any>)
                    .find({
                        follower: new Types.ObjectId(userId),
                        targetType: 'user',
                        status: 1,
                    })
                    .select('targetId')
                    .lean();

                return follows.map((f: any) => f.targetId.toString());
            } catch (error: any) {
                throw new DatabaseError(
                    'Failed to get following IDs',
                    'getFollowingIds',
                    { userId, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async getFollowing(userId: string, options: ProcessedQueryFilters) {
        return this.executeWithLogging('getFollowing', async () => {
            try {
                const pipeline: any[] = [
                    {
                        $match: {
                            follower: new Types.ObjectId(userId),
                            targetType: 'user',
                            status: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'targetId',
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
                            userId: '$user._id',
                            name: '$user.name',
                        },
                    },
                ];

                if (options.order?.length) {
                    const sort: any = {};
                    options.order.forEach(([field, dir]) => {
                        if (['name', 'createdAt'].includes(field)) {
                            sort[field] = dir === 'asc' ? 1 : -1;
                        }
                    });
                    if (Object.keys(sort).length > 0) {
                        pipeline.push({ $sort: sort });
                    }
                } else {
                    pipeline.push({ $sort: { createdAt: -1 } });
                }

                if (options.pagination) {
                    pipeline.push({ $skip: options.pagination.offset || 0 });
                    if (options.pagination.limit && options.pagination.limit > 0) {
                        pipeline.push({ $limit: options.pagination.limit });
                    }
                }

                const result = await (this.model as Model<any>).aggregate(pipeline).exec();
                return result;
            } catch (error: any) {
                throw new DatabaseError(
                    'Failed to get following',
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
                            targetId: new Types.ObjectId(userId),
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
                            userId: '$user._id',
                            name: '$user.name',
                        },
                    },
                ];

                if (options.order?.length) {
                    const sort: any = {};
                    options.order.forEach(([field, dir]) => {
                        if (['name', 'createdAt'].includes(field)) {
                            sort[field] = dir === 'asc' ? 1 : -1;
                        }
                    });
                    if (Object.keys(sort).length > 0) {
                        pipeline.push({ $sort: sort });
                    }
                } else {
                    pipeline.push({ $sort: { createdAt: -1 } });
                }

                if (options.pagination) {
                    pipeline.push({ $skip: options.pagination.offset || 0 });
                    if (options.pagination.limit && options.pagination.limit > 0) {
                        pipeline.push({ $limit: options.pagination.limit });
                    }
                }

                const result = await (this.model as Model<any>).aggregate(pipeline).exec();
                return result;
            } catch (error: any) {
                throw new DatabaseError(
                    'Failed to get followers',
                    'getFollowers',
                    { userId, options, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async countFollows(userId: string, type: 'followers' | 'following'): Promise<number> {
        return this.executeWithLogging('countFollows', async () => {
            const filter = type === 'followers' 
                ? { targetId: new Types.ObjectId(userId), targetType: 'user', status: 1 }
                : { follower: new Types.ObjectId(userId), targetType: 'user', status: 1 };
                
            return await this.count(filter);
        });
    }
}

export { FollowRepository };
