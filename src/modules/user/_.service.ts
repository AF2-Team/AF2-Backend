import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';
import { NotFoundError, ValidationError } from '@errors';
import mongoose from 'mongoose';
import { ImageKitService } from '@providers/imagekit.provider.js';

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
            throw new ValidationError('User not found');
        }

        const userId = user._id.toString();

        const [posts, followers, following] = await Promise.all([
            postRepo.count({ user: userId, status: 1 }),
            followRepo.count({ target: userId, targetType: 'user', status: 1 }),
            followRepo.count({ follower: userId, targetType: 'user', status: 1 }),
        ]);

        let isFollowing = false;

        if (viewerId && mongoose.Types.ObjectId.isValid(viewerId)) {
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
            stats: { posts, followers, following },
            viewer: { isFollowing },
        };
    }

    async updateProfile(userId: string, data: any) {
        if (!userId) throw new ValidationError('User id is required');

        // Solo permitimos modificar campos de texto.
        // Las imágenes se manejan exclusivamente en updateAvatar/updateCover para gestionar ImageKit correctamente.
        const allowed = ['name', 'bio'];
        const payload = this.sanitizeData(data, allowed);

        if (typeof payload.name === 'string' && payload.name.trim().length === 0)
            throw new ValidationError('Name cannot be empty');

        if (typeof payload.bio === 'string' && payload.bio.length > 300)
            throw new ValidationError('Bio cannot exceed 300 characters');

        const updated = await Database.repository('main', 'user').update(userId, payload);

        if (!updated) throw new NotFoundError('User not found');

        return updated;
    }

    async deactivate(userId: string) {
        if (!userId) throw new ValidationError('User id is required');

        const updated = await Database.repository('main', 'user').update(userId, { status: 0 });

        if (!updated) throw new NotFoundError('User not found');

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

    async updateAvatar(userId: string, file: any) {
        if (!userId) throw new ValidationError('User id is required');
        if (!file) throw new ValidationError('Avatar file is required');

        const userRepo = Database.repository('main', 'user');
        const currentUser = await userRepo.getById(userId);

        if (currentUser?.avatarFileId) {
            await ImageKitService.delete(currentUser.avatarFileId);
        }

        const res = (await ImageKitService.upload(file, 'avatars')) as any;
        if (!res?.url || !res?.fileId) throw new ValidationError('Failed to upload avatar');

        const updatedUser = await userRepo.update(userId, {
            avatarUrl: res.url,
            avatarFileId: res.fileId,
        });

        return {
            id: updatedUser._id || updatedUser.id,
            username: updatedUser.username,
            avatarUrl: updatedUser.avatarUrl,
            updatedAt: updatedUser.updatedAt,
        };
    }

    async updateCover(userId: string, file: any) {
        if (!userId) throw new ValidationError('User id is required');
        if (!file) throw new ValidationError('Cover file is required');

        const userRepo = Database.repository('main', 'user');
        const currentUser = await userRepo.getById(userId);

        if (currentUser?.coverFileId) {
            await ImageKitService.delete(currentUser.coverFileId);
        }

        const res = (await ImageKitService.upload(file, 'covers')) as any;
        if (!res?.url || !res?.fileId) throw new ValidationError('Failed to upload cover');

        return userRepo.update(userId, {
            coverUrl: res.url,
            coverFileId: res.fileId,
        });
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
