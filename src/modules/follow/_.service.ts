import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import NotificationService from '../notification/notification.service.js';

class FollowService extends BaseService {
    async followUser(followerId: string, targetUserId: string) {
        if (followerId === targetUserId) {
            throw new Error('User cannot follow itself');
        }

        const followRepo = Database.repository('main', 'follow');

        const exists = await followRepo.exists({
            follower: followerId,
            target: targetUserId,
            targetType: 'user',
        });

        if (exists) return { followed: true };

        await followRepo.create({
            follower: followerId,
            target: targetUserId,
            targetType: 'user',
            status: 1,
        });

        // 🔔 notification
        await NotificationService.notify({
            user: targetUserId,
            actor: followerId,
            type: 'follow',
            entityId: followerId,
        });

        return { followed: true };
    }

    async unfollowUser(followerId: string, targetUserId: string) {
        const followRepo = Database.repository('main', 'follow');

        const deleted = await followRepo.deleteFollow({
            follower: followerId,
            target: targetUserId,
            targetType: 'user',
        });

        return { unfollowed: deleted };
    }
}

export default new FollowService();
