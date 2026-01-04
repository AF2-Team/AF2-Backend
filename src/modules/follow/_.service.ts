import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import NotificationService from '../notification/_.service.js';

class FollowService extends BaseService {
    async followUser(followerId: string, targetUserId: string) {
        if (followerId === targetUserId) {
            throw new Error('User cannot follow itself');
        }

        const followRepo = Database.repository('main', 'follow') as any;

        const exists = await followRepo.exists(followerId, targetUserId, 'user');

        if (exists) return { followed: true };

        await followRepo.create({
            follower: followerId,
            target: targetUserId,
            targetType: 'user',
            status: 1,
        });

        await NotificationService.notify({
            user: targetUserId,
            actor: followerId,
            type: 'follow',
            entityId: followerId,
        });

        return { followed: true };
    }

    async unfollowUser(followerId: string, targetUserId: string) {
        const followRepo = Database.repository('main', 'follow') as any;

        const removed = await followRepo.remove(followerId, targetUserId, 'user');

        return { unfollowed: removed };
    }
}

export default new FollowService();
