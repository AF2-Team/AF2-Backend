import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class UserService extends BaseService {
    async getFollowing(userId: string, options: ProcessedQueryFilters) {
        const followRepo = Database.repository('main', 'follow');

        return followRepo.getAllActive(options, {
            follower: userId,
            targetType: 'user',
            status: 1,
        });
    }

    async getFollowers(userId: string, options: ProcessedQueryFilters) {
        const followRepo = Database.repository('main', 'follow');

        return followRepo.getAllActive(options, {
            target: userId,
            targetType: 'user',
            status: 1,
        });
    }

    async getProfile(userId: string, viewerId?: string) {
        const userRepo = Database.repository('main', 'user');
        const postRepo = Database.repository('main', 'post');
        const followRepo = Database.repository('main', 'follow');

        const user = await userRepo.getById(userId);
        if (!user || user.status !== 1) return null;

        const [posts, followers, following] = await Promise.all([
            postRepo.count({ user: userId, status: 1 }),
            followRepo.count({ target: userId, targetType: 'user', status: 1 }),
            followRepo.count({ follower: userId, targetType: 'user', status: 1 }),
        ]);

        let isFollowing = false;

        if (viewerId) {
            const exists = await followRepo.getOne({
                follower: viewerId,
                target: userId,
                targetType: 'user',
                status: 1,
            });
            isFollowing = !!exists;
        }

        return {
            user,
            stats: {
                posts,
                followers,
                following,
            },
            viewer: {
                isFollowing,
            },
        };
    }
}

export default new UserService();
