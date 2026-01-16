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

    async updateUsername(userId: string, username: string) {
        if (!userId) throw new ValidationError('User id is required');
        if (!username) throw new ValidationError('Username is required');

        const normalized = username.trim().toLowerCase();

        if (!/^[a-z0-9._]{3,30}$/.test(normalized)) {
            throw new ValidationError('Invalid username format', [
                'Username must be 3–30 characters',
                'Only letters, numbers, dots and underscores are allowed',
            ]);
        }

        const userRepo = Database.repository('main', 'user');

        const currentUser = await userRepo.getById(userId);
        if (!currentUser || currentUser.status !== 1) {
            throw new NotFoundError('User not found');
        }

        const now = new Date();

        if (currentUser.username === normalized) {
            throw new ValidationError('Username is the same as current');
        }

        const COOLDOWN_MINUTES = 10;

        if (currentUser.lastUsernameChange) {
            const now = new Date();
            const diffMs = now.getTime() - currentUser.lastUsernameChange.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));

            if (diffMinutes < COOLDOWN_MINUTES) {
                const minutesLeft = COOLDOWN_MINUTES - diffMinutes;

                throw new ValidationError(`You can change your username only once every ${COOLDOWN_MINUTES} minutes`, [
                    `Please wait ${minutesLeft} more minute${minutesLeft === 1 ? '' : 's'}`,
                ]);
            }
        }

        const exists = await userRepo.getOne({
            username: normalized,
            status: 1,
            _id: { $ne: userId },
        });

        if (exists) {
            throw new ValidationError('Username already taken');
        }

        const updated = await userRepo.update(userId, {
            username: normalized,
            lastUsernameChange: now,
        });

        return {
            username: updated.username,
            lastUsernameChange: updated.lastUsernameChange,
            updatedAt: updated.updatedAt,
        };
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

        return (followRepo as any).getFollowingUsers(userId, options);
    }

    async getFollowers(userId: string, options: ProcessedQueryFilters) {
        if (!userId) throw new ValidationError('User id is required');

        const followRepo = Database.repository('main', 'follow');

        return (followRepo as any).getFollowersUsers(userId, options);
    }

    async updateAvatar(userId: string, file: any) {
        if (!userId) throw new ValidationError('User id is required');
        if (!file) throw new ValidationError('Avatar file is required');

        const userRepo = Database.repository('main', 'user');
        const currentUser = await userRepo.getById(userId);

        if (currentUser?.avatarFileId) {
            await ImageKitService.delete(currentUser.avatarFileId).catch(() => null);
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

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new ValidationError('Invalid file type. Only JPEG, PNG and WebP are allowed');
        }

        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new ValidationError('File size exceeds 5MB limit');
        }
        const userRepo = Database.repository('main', 'user');

        const currentUser = await userRepo.getById(userId);
        if (!currentUser) throw new NotFoundError('User', userId);

        if (currentUser.coverFileId) {
            await ImageKitService.delete(currentUser.coverFileId).catch(() => null);
        }

        const res = (await ImageKitService.upload(file, 'covers')) as any;
        if (!res?.url || !res?.fileId) {
            throw new ValidationError('Failed to upload cover');
        }

        const updated = await userRepo.update(userId, {
            coverUrl: res.url,
            coverFileId: res.fileId,
        });

        return {
            coverUrl: updated.coverUrl,
            updatedAt: updated.updatedAt,
        };
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
