import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';
import { ValidationError } from '@errors/validation.error.js';
// [IMPORTANTE] Importar el tipo del repositorio para el casting
import PostRepository from '@database/repositories/main/post.repository.js'; 

type FeedItem = {
    type: 'post' | 'repost';
    post: any;
    createdAt: Date;
    score: number;
};

class FeedService extends BaseService {

    private cleanPost(doc: any) {
        if (!doc) return null;
        const obj = doc.toObject ? doc.toObject() : doc;

        let user = obj.user;
        if (user && (user._id || typeof user === 'object')) {
            user = {
                _id: user._id || user.toString(),
                name: user.name || user.username || 'Usuario',
                username: user.username || 'unknown',
                avatarUrl: user.avatarUrl || null
            };
        }

        return {
            _id: obj._id,
            text: obj.text,
            url: obj.url,
            media: obj.media || [],
            mediaUrl: obj.mediaUrl,
            tags: obj.tags || [],
            type: obj.type,
            status: obj.status,
            publishStatus: obj.publishStatus,
            createdAt: obj.createdAt,
            user: user,
            likesCount: obj.likesCount || 0,
            commentsCount: obj.commentsCount || 0,
            repostsCount: obj.repostsCount || 0,
            favoritesCount: obj.favoritesCount || 0,
            isLiked: false 
        };
    }

    private calculateScore(post: any): number {
        if (!post) return 0;
        return (
            (post.likesCount || 0) * 3 +
            (post.commentsCount || 0) * 5 +
            (post.repostsCount || 0) * 4 +
            (post.favoritesCount || 0) * 2
        );
    }

    async getFeed(userId: string | undefined, options: ProcessedQueryFilters) {
        try {
            // [CAMBIO] Casting explícito para usar métodos personalizados
            const postRepo = Database.repository('main', 'post') as any;
            const followRepo = Database.repository('main', 'follow');

            let allowedUsers: string[] = [];

            if (userId) {
                const follows = await followRepo.getAllActive(
                    {},
                    { follower: userId, targetModel: 'User', status: 1 },
                );
                allowedUsers = [userId, ...follows.map((f: any) => f.target?.toString()).filter(Boolean)];
            }

            const cursor = options.raw?.cursor;
            const cursorDate = cursor ? new Date(cursor) : undefined;

            const where: any = {
                publishStatus: 'published',
                status: 1,
            };

            if (allowedUsers.length > 0) {
                where.user = { $in: allowedUsers };
            }

            if (cursorDate) {
                where.createdAt = { $lt: cursorDate };
            }

            const limit = options.pagination?.limit ?? 20;
            const fetchLimit = limit * 3;

            const posts = await postRepo.getAllActive(
                {
                    pagination: { limit: fetchLimit, offset: 0 },
                    order: [['createdAt', 'desc']],
                },
                where,
            );

            // [FIX] Usamos el método público del repositorio
            if (posts.length > 0) {
                await postRepo.populateAuthors(posts);
            }

            const scored: FeedItem[] = posts.map((post: any) => ({
                type: post.type === 'repost' ? 'repost' : 'post',
                post: this.cleanPost(post),
                createdAt: post.createdAt || new Date(),
                score: this.calculateScore(post),
            }));

            scored.sort((a, b) => {
                if (a.score !== b.score) return b.score - a.score;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });

            const items = scored.slice(0, limit);

            return items.map(item => item.post);

        } catch (error) {
            if (error instanceof ValidationError) throw error;
            throw new ValidationError('Failed to load feed', undefined, {
                cause: error instanceof Error ? error : undefined,
            });
        }
    }
    
    // ... getTagFeed
    async getTagFeed(userId: string | undefined, options: ProcessedQueryFilters) {
        return [];
    }
}

export default new FeedService();