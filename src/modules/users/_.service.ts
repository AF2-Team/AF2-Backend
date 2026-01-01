import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class UserService extends BaseService {
    async getFollowing(userId: string, options: ProcessedQueryFilters) {
        const followRepo = Database.repository('main', 'follow');

        return followRepo.getFollowing(userId, options);
    }

    async getFollowers(userId: string, options: ProcessedQueryFilters) {
        const followRepo = Database.repository('main', 'follow');

        return followRepo.getFollowers(userId, options);
    }

    async getProfile(userId: string, viewerId?: string) {
        const userRepo = Database.repository('main', 'user');
        const postRepo = Database.repository('main', 'post');
        const followRepo = Database.repository('main', 'follow');

        const user = await userRepo.getById(userId);
        if (!user || user.status !== 1) return null;

        const [postsCount, followersCount, followingCount] = await Promise.all([
            postRepo.count({ user: userId, status: 1 }),
            followRepo.count({ target: userId, targetType: 'user', status: 1 }),
            followRepo.count({ follower: userId, targetType: 'user', status: 1 }),
        ]);

        let isFollowing = false;

        if (viewerId) {
            isFollowing = await followRepo.exists({
                follower: viewerId,
                target: userId,
                targetType: 'user',
            });
        }

        return {
            user,
            stats: {
                posts: postsCount,
                followers: followersCount,
                following: followingCount,
            },
            viewer: {
                isFollowing,
            },
        };
    }
}

export default new UserService();
