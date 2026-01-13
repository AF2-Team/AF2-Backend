import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';
import { ValidationError, NotFoundError } from '@errors';
import mongoose from 'mongoose';

class UserService extends BaseService {
    async getProfileById(userId: string, viewerId?: string) {
        if (!userId) {
            throw new ValidationError('User id is required');
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ValidationError('Invalid user id format');
        }

        return this.buildProfile({ _id: userId }, viewerId);
    }

    async getProfileByUsername(username: string, viewerId?: string) {
        if (!username) {
            throw new ValidationError('Username is required');
        }

        return this.buildProfile({ username }, viewerId);
    }

    private async buildProfile(where: any, viewerId?: string) {
        const userRepo = Database.repository('main', 'user');
        const postRepo = Database.repository('main', 'post');
        const followRepo = Database.repository('main', 'follow');

        const user = await userRepo.getOne({ ...where, status: 1 });

        if (!user) {
            throw new NotFoundError('User');
        }

        const userId = user._id.toString();

        // Usamos los contadores del usuario para followers/following
        // Solo contamos posts en tiempo real
        const posts = await postRepo.count({ user: userId, status: 1 });

        let isFollowing = false;
        const isMe = viewerId === userId;

        if (viewerId && mongoose.Types.ObjectId.isValid(viewerId) && !isMe) {
            const exists = await followRepo.getOne({
                follower: viewerId,
                target: userId,
                targetModel: 'User',
                status: 1,
            });
            isFollowing = !!exists;
        }

        return {
            user,
            stats: {
                posts,
                followers: user.followersCount,
                following: user.followingCount,
            },
            viewer: { isFollowing, isMe },
        };
    }

    async updateProfile(userId: string, data: any) {
        if (!userId) throw new ValidationError('User id is required');

        const allowed = ['name', 'bio', 'avatarUrl'];
        const payload = this.sanitizeData(data, allowed);

        const updated = await Database.repository('main', 'user').update(userId, payload);

        if (!updated) throw new ValidationError('User not found');

        return updated;
    }

    async deactivate(userId: string) {
        if (!userId) throw new ValidationError('User id is required');

        const updated = await Database.repository('main', 'user').update(userId, { status: 0 });

        if (!updated) throw new ValidationError('User not found');

        return updated;
    }

    async getFollowing(userId: string, options: ProcessedQueryFilters) {
        if (!userId) throw new ValidationError('User id is required');

        const followRepo = Database.repository('main', 'follow');

        return followRepo.getAllActive(options, {
            follower: userId,
            targetType: 'user',
            status: 1,
        });
    }

    async getFollowers(userId: string, options: ProcessedQueryFilters) {
        if (!userId) throw new ValidationError('User id is required');

        const followRepo = Database.repository('main', 'follow');

        return followRepo.getAllActive(options, {
            target: userId,
            targetType: 'user',
            status: 1,
        });
    }

    async updateAvatar(userId: string, file: Express.Multer.File) {
        if (!userId) throw new ValidationError('User id is required');
        if (!file) throw new ValidationError('Avatar file is required');

        const avatarUrl = `/uploads/avatars/${file.filename}`;

        return Database.repository('main', 'user').update(userId, { avatarUrl });
    }

    async getUserPosts(userId: string, options: ProcessedQueryFilters) {
        if (!userId) throw new ValidationError('User id is required');

        const postRepo = Database.repository('main', 'post');

        return postRepo.getAllActive(options, {
            user: userId,
            status: 1,
            isRepost: false,
        });
    }

    async getUserReposts(userId: string, options: ProcessedQueryFilters) {
        if (!userId) throw new ValidationError('User id is required');

        const postRepo = Database.repository('main', 'post');

        return postRepo.getAllActive(options, {
            user: userId,
            isRepost: true,
            status: 1,
        });
    }

    async getUserFavorites(userId: string, options: ProcessedQueryFilters) {
        if (!userId) throw new ValidationError('User id is required');

        const favoriteRepo = Database.repository('main', 'favorite');

        return favoriteRepo.getAllActive(options, {
            user: userId,
            status: 1,
        });
    }
}

export default new UserService();
