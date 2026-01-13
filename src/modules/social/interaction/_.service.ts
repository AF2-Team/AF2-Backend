import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ValidationError, NotFoundError } from '@errors';
import NotificationService from '@modules/social/notification/_.service.js';

class InteractionService extends BaseService {
    private getInteractionRepo() {
        return Database.repository('main', 'interaction');
    }

    private getPostRepo() {
        return Database.repository('main', 'post');
    }

    async likePost(userId: string, postId: string) {
        this.validateRequired({ userId, postId }, ['userId', 'postId']);

        const interactionRepo = this.getInteractionRepo();
        const postRepo = this.getPostRepo();

        const post = await postRepo.getById(postId);
        if (!post || post.status !== 1) {
            throw new NotFoundError('Post', postId);
        }

        const existing = await interactionRepo.getOne({
            user: userId,
            post: postId,
            type: 'like',
            status: 1,
        });

        if (existing) {
            return { liked: true, alreadyLiked: true };
        }

        await interactionRepo.create({
            user: userId,
            post: postId,
            type: 'like',
            status: 1,
        });

        await postRepo.update(postId, {
            likesCount: (post.likesCount || 0) + 1,
        });

        if (post.user.toString() !== userId) {
            await NotificationService.notify({
                user: post.user.toString(),
                actor: userId,
                type: 'like',
                entityId: postId,
            });
        }

        return { liked: true };
    }

    async unlikePost(userId: string, postId: string) {
        this.validateRequired({ userId, postId }, ['userId', 'postId']);

        const interactionRepo = this.getInteractionRepo();
        const postRepo = this.getPostRepo();

        const like = await interactionRepo.getOne({
            user: userId,
            post: postId,
            type: 'like',
            status: 1,
        });

        if (!like) {
            return { unliked: false, notLiked: true };
        }

        await interactionRepo.update(like._id.toString(), { status: 0 });

        const post = await postRepo.getById(postId);
        if (post) {
            await postRepo.update(postId, {
                likesCount: Math.max(0, (post.likesCount || 0) - 1),
            });
        }

        return { unliked: true };
    }

    async createComment(userId: string, postId: string, text: string) {
        this.validateRequired({ userId, postId, text }, ['userId', 'postId', 'text']);

        if (text.trim().length === 0) {
            throw new ValidationError('Comment text cannot be empty');
        }

        if (text.length > 500) {
            throw new ValidationError('Comment cannot exceed 500 characters');
        }

        const interactionRepo = this.getInteractionRepo();
        const postRepo = this.getPostRepo();

        const post = await postRepo.getById(postId);
        if (!post || post.status !== 1) {
            throw new NotFoundError('Post', postId);
        }

        const comment = await interactionRepo.create({
            user: userId,
            post: postId,
            type: 'comment',
            text: text.trim(),
            status: 1,
        });

        await postRepo.update(postId, {
            commentsCount: (post.commentsCount || 0) + 1,
        });

        if (post.user.toString() !== userId) {
            await NotificationService.notify({
                user: post.user.toString(),
                actor: userId,
                type: 'comment',
                entityId: postId,
            });
        }

        return comment;
    }

    async getComments(postId: string, options: any) {
        this.validateRequired({ postId }, ['postId']);

        const interactionRepo = this.getInteractionRepo();

        const postRepo = this.getPostRepo();
        const post = await postRepo.getById(postId);
        if (!post) {
            throw new NotFoundError('Post', postId);
        }

        const result = await interactionRepo.getAllActive(options, {
            post: postId,
            type: 'comment',
            status: 1,
        });

        return result;
    }
}

export default new InteractionService();
