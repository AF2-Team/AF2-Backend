import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

type FeedItem = {
    type: 'post' | 'repost';
    post: any;
    actor?: any;
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

    async getFeed(userId: string, options: ProcessedQueryFilters) {
        const followRepo = Database.repository('main', 'follow');
        const postRepo = Database.repository('main', 'post');
        const interactionRepo = Database.repository('main', 'interaction');

        const following = await followRepo.getFollowingIds(userId);
        const blocked = await followRepo.getBlockedIds(userId);

        const sourceUsers = [userId, ...following].filter((id) => !blocked.includes(id));

        const poolLimit = (options.pagination?.limit ?? 20) * 4;

        const postsByUser = await Promise.all(
            sourceUsers.map((uid) =>
                postRepo.getAllActive(
                    {
                        pagination: { offset: 0, limit: poolLimit },
                        order: [['createdAt', 'desc']],
                    },
                    {
                        user: uid,
                        publishStatus: 'published',
                        ...(typeof options.filters?.tag === 'string' ? { tags: options.filters.tag } : {}),
                    },
                ),
            ),
        );

        const posts = postsByUser.flat();

        const postItems = posts.map((post: any) => ({
            type: 'post' as const,
            post,
            createdAt: post.createdAt,
            score: this.calculateScore(post),
        }));

        const reposts = await interactionRepo.getRepostsByUsers(sourceUsers, {
            pagination: { offset: 0, limit: poolLimit },
        });

        const repostItems = reposts
            .filter((i: any) => i.post)
            .map((i: any) => ({
                type: 'repost' as const,
                post: i.post,
                actor: i.user,
                createdAt: i.createdAt,
                score: this.calculateScore(i.post),
            }));

        const mixed = [...postItems, ...repostItems].sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });

        const offset = options.pagination?.offset ?? 0;
        const limit = options.pagination?.limit ?? 20;

        return mixed.slice(offset, offset + limit);
    }
}

export default new FeedService();
