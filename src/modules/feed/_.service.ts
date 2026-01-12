import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

type FeedItem = {
    type: 'post' | 'repost';
    post: any;
    createdAt: Date;
    score: number;
};

class FeedService extends BaseService {
    private calculateScore(post: any): number {
        return (
            (post.likesCount ?? 0) * 3 +
            (post.commentsCount ?? 0) * 5 +
            (post.repostsCount ?? 0) * 4 +
            (post.favoritesCount ?? 0) * 2
        );
    }

    async getFeed(userId: string | undefined, options: ProcessedQueryFilters) {
        const postRepo = Database.repository('main', 'post');
        const followRepo = Database.repository('main', 'follow');

        let allowedUsers: string[] | undefined;

        if (userId) {
            const follows = await followRepo.getAllActive(
                {},
                {
                    follower: userId,
                    targetModel: 'User',
                    status: 1,
                },
            );

            allowedUsers = [userId, ...follows.map((f: any) => f.target)];
        }

        const cursor = options.raw?.cursor;
        const cursorDate = cursor ? new Date(cursor) : undefined;

        const where: any = {
            publishStatus: 'published',
            status: 1,
        };

        if (allowedUsers) where.user = { $in: allowedUsers };
        if (cursorDate) where.createdAt = { $lt: cursorDate };

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
            type: post.type === 'repost' ? 'repost' : 'post',
            post,
            createdAt: post.createdAt,
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
    }

    async getTagFeed(userId: string | undefined, options: ProcessedQueryFilters) {
        const postRepo = Database.repository('main', 'post');
        const followRepo = Database.repository('main', 'follow');

        let tags: string[] = [];

        const rawTags = options.raw?.tags;
        if (rawTags) {
            tags = rawTags
                .split(',')
                .map((t: string) => t.toLowerCase().trim())
                .filter(Boolean);
        }

        if (!tags.length && userId) {
            const follows = await followRepo.getAllActive({}, { follower: userId, targetModel: 'Tag', status: 1 });

            tags = follows.map((f: any) => f.target);
        }

        const cursor = options.raw?.cursor;
        const cursorDate = cursor ? new Date(cursor) : undefined;

        const where: any = {
            publishStatus: 'published',
            status: 1,
        };

        if (tags.length) {
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
    }
}

export default new FeedService();
