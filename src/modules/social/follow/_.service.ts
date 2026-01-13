import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ValidationError } from '@errors';
import FollowRepository from '@database/repositories/main/follow.repository.js';

class FollowService extends BaseService {
    async followUser(followerId: string, targetUserId: string) {
        if (followerId === targetUserId) {
            throw new ValidationError('User cannot follow itself');
        }

        const userRepo = Database.repository('main', 'user');

        const existingFollowing: any = await FollowRepository.findRelationship(followerId, targetUserId, 'User');

        if (existingFollowing) {
            if(existingFollowing.status === 1) {
                return {followed: true};
            }
            
            await FollowRepository.reactivate(existingFollowing._id);
          
            await userRepo.update(targetUserId, { $inc: { followersCount: 1 } });
            await userRepo.update(followerId, { $inc: { followingCount: 1 } });

            return { followed: true };

        }

        await FollowRepository.createFollow(followerId, targetUserId, 'User');

        await userRepo.update(targetUserId, { $inc: { followersCount: 1 } });
        await userRepo.update(followerId, { $inc: { followingCount: 1 } });

        return { followed: true };
    }

    async unfollowUser(followerId: string, targetUserId: string) {
        const repo = Database.repository('main', 'follow');
        const userRepo = Database.repository('main', 'user');

        const follow = await repo.getOne({
            follower: followerId,
            target: targetUserId,
            targetModel: 'User',
            status: 1,
        });

        if (!follow) return { unfollowed: false };

        await repo.update(follow._id.toString(), { status: 0 });

        await userRepo.update(targetUserId, { $inc: { followersCount: -1 } });
        await userRepo.update(followerId, { $inc: { followingCount: -1 } });
        
        return { unfollowed: true };
    }

    async getFollowers(userId: string, options: any) {
        return FollowRepository.getFollowersUsers(userId, options);
    }

    async getFollowing(userId: string, options: any) {
        return FollowRepository.getFollowingUsers(userId, options);
    }

    async followTag(userId: string, tagId: string) {
        const repo = Database.repository('main', 'follow');

        const existingFollowing: any = await FollowRepository.findRelationship(userId, tagId, 'Tag');

        if (existingFollowing) return { followed: true };

        await repo.create({
            follower: userId,
            target: tagId,
            targetModel: 'Tag',
            status: 1,
        });

        return { followed: true };
    }

    async unfollowTag(userId: string, tagId: string) {
        const repo = Database.repository('main', 'follow');
        

        const follow = await repo.getOne({
            follower: userId,
            target: tagId,
            targetModel: 'Tag',
            status: 1,
        });

        if (!follow) return { unfollowed: false };

        await repo.update(follow._id.toString(), { status: 0 });
        return { unfollowed: true };
    }
}

export default new FollowService();
