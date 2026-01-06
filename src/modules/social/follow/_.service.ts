import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ValidationError } from '@errors';

class FollowService extends BaseService {
    async followUser(followerId: string, targetUserId: string) {
        if (followerId === targetUserId) {
            throw new ValidationError('User cannot follow itself');
        }

        const repo = Database.repository('main', 'follow');

        const exists = await repo.getOne({
            follower: followerId,
            target: targetUserId,
            targetType: 'user',
            status: 1,
        });

        if (exists) return { followed: true };

        await repo.create({
            follower: followerId,
            target: targetUserId,
            targetType: 'user',
            status: 1,
        });

        return { followed: true };
    }

    async unfollowUser(followerId: string, targetUserId: string) {
        const repo = Database.repository('main', 'follow');

        const follow = await repo.getOne({
            follower: followerId,
            target: targetUserId,
            targetType: 'user',
            status: 1,
        });

        if (!follow) return { unfollowed: false };

        await repo.update(follow._id.toString(), { status: 0 });
        return { unfollowed: true };
    }

    async getFollowers(userId: string, options: any) {
        const repo = Database.repository('main', 'follow');

        return repo.getAllActive(options, {
            target: userId,
            targetType: 'user',
            status: 1,
        });
    }

    async getFollowing(userId: string, options: any) {
        const repo = Database.repository('main', 'follow');

        return repo.getAllActive(options, {
            follower: userId,
            targetType: 'user',
            status: 1,
        });
    }

    async followTag(userId: string, tagId: string) {
        const repo = Database.repository('main', 'follow');

        const exists = await repo.getOne({
            follower: userId,
            target: tagId,
            targetType: 'tag',
            status: 1,
        });

        if (exists) return { followed: true };

        await repo.create({
            follower: userId,
            target: tagId,
            targetType: 'tag',
            status: 1,
        });

        return { followed: true };
    }

    async unfollowTag(userId: string, tagId: string) {
        const repo = Database.repository('main', 'follow');

        const follow = await repo.getOne({
            follower: userId,
            target: tagId,
            targetType: 'tag',
            status: 1,
        });

        if (!follow) return { unfollowed: false };

        await repo.update(follow._id.toString(), { status: 0 });
        return { unfollowed: true };
    }
}

export default new FollowService();
