import mongoose from 'mongoose';
import FollowModel from '@database/models/main/follow.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

type FollowTargetType = 'user' | 'tag';

class FollowRepository extends MongooseRepositoryBase<typeof FollowModel> {
    constructor() {
        super(FollowModel);
    }

    async exists(followerId: string, targetId: string, targetType: FollowTargetType): Promise<boolean> {
        const result = await this.model.exists({
            follower: followerId,
            target: targetId,
            targetType,
            status: 1,
        });

        return !!result;
    }

    async remove(followerId: string, targetId: string, targetType: FollowTargetType): Promise<boolean> {
        const result = await this.model.deleteOne({
            follower: followerId,
            target: targetId,
            targetType,
        });

        return (result.deletedCount ?? 0) > 0;
    }

    async getFollowingUsers(userId: string, options: any = {}) {
        return this.execute('getFollowingUsers', async () => {
            return this.getUsersByRelation(
                {
                    follower: new mongoose.Types.ObjectId(userId),
                    targetType: 'user',
                },
                'target',
                options,
            );
        });
    }

    async getFollowersUsers(userId: string, options: any = {}) {
        return this.execute('getFollowersUsers', async () => {
            return this.getUsersByRelation(
                {
                    target: new mongoose.Types.ObjectId(userId),
                    targetType: 'user',
                },
                'follower',
                options,
            );
        });
    }

    private async getUsersByRelation(match: Record<string, any>, userField: 'target' | 'follower', options: any) {
        const pipeline: any[] = [
            {
                $match: {
                    ...match,
                    status: 1,
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: userField,
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
            options.order.forEach(([field, dir]: any) => {
                sort[`user.${field}`] = dir === 'asc' ? 1 : -1;
            });
            pipeline.push({ $sort: sort });
        }

        if (options.pagination) {
            pipeline.push({ $skip: options.pagination.offset ?? 0 });
            if (options.pagination.limit > 0) {
                pipeline.push({ $limit: options.pagination.limit });
            }
        }

        const result = await this.model.aggregate(pipeline).exec();
        return result.map((r: any) => r.user);
    }
}

export default new FollowRepository();
