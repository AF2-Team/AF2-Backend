import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class UserService extends BaseService {
    async getProfileById(userId: string, viewerId?: string) {
        return this.buildProfile({ _id: userId }, viewerId);
    }

    async getProfileByUsername(username: string, viewerId?: string) {
        return this.buildProfile({ username }, viewerId);
    }

    private async buildProfile(where: any, viewerId?: string) {
        const userRepo = Database.repository('main', 'user');
        const postRepo = Database.repository('main', 'post');
        const followRepo = Database.repository('main', 'follow');

        const user = await userRepo.getOne({ ...where, status: 1 });
        if (!user) return null;

        const [posts, followers, following] = await Promise.all([
            postRepo.count({ user: user._id.toString(), status: 1 }),
            followRepo.count({ target: user._id.toString(), targetType: 'user', status: 1 }),
            followRepo.count({ follower: user._id.toString(), targetType: 'user', status: 1 }),
        ]);

        let isFollowing = false;

        if (viewerId) {
            const exists = await followRepo.getOne({
                follower: viewerId,
                target: user._id.toString(),
                targetType: 'user',
                status: 1,
            });
            isFollowing = !!exists;
        }

        return {
            user,
            stats: { posts, followers, following },
            viewer: { isFollowing },
        };
    }

    async updateProfile(userId: string, data: any) {
        const allowed = ['name', 'bio', 'avatarUrl'];
        const payload = this.sanitizeData(data, allowed);

        return Database.repository('main', 'user').update(userId, payload);
    }

    async deactivate(userId: string) {
        return Database.repository('main', 'user').update(userId, { status: 0 });
    }

    // 🔽 existentes
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

    async updateAvatar(userId: string, file: Express.Multer.File) {
        const avatarUrl = `/uploads/avatars/${file.filename}`;

        return Database.repository('main', 'user').update(userId, {
            avatarUrl,
        });
    }

    async getUserPosts(userId: string, options: ProcessedQueryFilters) {
        const postRepo = Database.repository('main', 'post');

        return postRepo.getAllActive(options, {
            user: userId,
            status: 1,
            isRepost: false,
        });
    }

    async getUserReposts(userId: string, options: ProcessedQueryFilters) {
        const postRepo = Database.repository('main', 'post');

        return postRepo.getAllActive(options, {
            user: userId,
            isRepost: true,
            status: 1,
        });
    }

    async getUserFavorites(userId: string, options: ProcessedQueryFilters) {
        const favoriteRepo = Database.repository('main', 'favorite');

        return favoriteRepo.getAllActive(options, {
            user: userId,
            status: 1,
        });
    }
}

export default new UserService();
