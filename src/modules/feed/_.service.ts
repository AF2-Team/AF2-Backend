import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';
import { ValidationError } from '@errors/validation.error.js';

type FeedItem = {
    type: 'post' | 'repost';
    post: any;
    createdAt: Date;
    score: number;
};



class FeedService extends BaseService {
    private calculateScore(post: any): number {
        if (!post) return 0;

        return (
            (post.likesCount || 0) * 3 +
            (post.commentsCount || 0) * 5 +
            (post.repostsCount || 0) * 4 +
            (post.favoritesCount || 0) * 2
        );
    }
    
    private cleanPost(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    // Rompemos referencia circular de usuario
    if (obj.user && obj.user._id) {
        obj.user = { 
            _id: obj.user._id, 
            name: obj.user.name, 
            username: obj.user.username, 
            avatarUrl: obj.user.avatarUrl 
        };
    }
    return obj;
}

    async getFeed(userId: string | undefined, options: ProcessedQueryFilters) {
        try {
            const postRepo = Database.repository('main', 'post');
            const followRepo = Database.repository('main', 'follow');

            let allowedUsers: string[] = [];

            if (userId) {
                const follows = await followRepo.getAllActive(
                    {},
                    {
                        follower: userId,
                        targetModel: 'User',
                        status: 1,
                    },
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
            } else if (userId) {
                where.user = userId;
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

          const scored: FeedItem[] = posts.map((post: any) => ({
    type: post.isRepost ? 'repost' : 'post',
    post: this.cleanPost(post), // <--- AQUÍ ESTÁ LA CLAVE ANTICRASH
    createdAt: post.createdAt || new Date(),
    score: this.calculateScore(post),
}));

            scored.sort((a, b) => {
                if (a.score !== b.score) return b.score - a.score;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });

            const items = scored.slice(0, limit);

            return {
                items,
                nextCursor: items.length ? items[items.length - 1].createdAt.toISOString() : null,
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new ValidationError('Failed to load feed', undefined, {
                cause: error instanceof Error ? error : undefined,
            });
        }
    }

    async getTagFeed(userId: string | undefined, options: ProcessedQueryFilters) {
        try {
            const postRepo = Database.repository('main', 'post');
            const followRepo = Database.repository('main', 'follow');
            const tagRepo = Database.repository('main', 'tag');

            let tags: string[] = [];
            
            const rawTags = options.raw?.tags;
            if (rawTags && typeof rawTags === 'string') {
                tags = rawTags
                    .split(',')
                    .map((t: string) => t.toLowerCase().trim())
                    .filter(Boolean);
            }

            if (!tags.length && userId) {
                const follows = await followRepo.getAllActive(
                    {},
                    {
                        follower: userId,
                        targetModel: 'Tag',
                        status: 1,
                    },
                );

                // Opción 1: target guarda el nombre normalizado directamente
                tags = follows
                    .map((f: any) => f.target)
                    .filter(Boolean)
                    .map((t: any) => t.toString());

                // Opción 2: target guarda ObjectId (descomentar si es necesario)
                /*
                const tagIds = follows.map((f: any) => f.target).filter(Boolean);
                if (tagIds.length > 0) {
                    const tagDocs = await tagRepo.getAllActive({}, { _id: { $in: tagIds } });
                    tags = tagDocs.map((t: any) => t.normalized || t.name.toLowerCase());
                }
                */
            }

            const cursor = options.raw?.cursor;
            const cursorDate = cursor ? new Date(cursor) : undefined;

            const where: any = {
                publishStatus: 'published',
                status: 1,
            };

            if (tags.length > 0) {
                where.tags = { $in: tags };
            }

            if (cursorDate) {
                where.createdAt = { $lt: cursorDate };
            }

            const limit = options.pagination?.limit ?? 20;

            const posts = await postRepo.getAllActive(
                {
                    pagination: { limit, offset: 0 },
                    order: [['createdAt', 'desc']],
                },
                where,
            );

            return {
                items: posts,
                nextCursor: posts.length ? posts[posts.length - 1].createdAt.toISOString() : null,
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new ValidationError('Failed to load tag feed', undefined, {
                cause: error instanceof Error ? error : undefined,
            });
        }
    }
}

export default new FeedService();
