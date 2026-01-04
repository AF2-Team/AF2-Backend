import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

type FeedItem = {
    type: 'post';
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

        const posts = await postRepo.getAllActive(
            {
                pagination: options.pagination,
                order: [['createdAt', 'desc']],
            },
            {
                publishStatus: 'published',
            },
        );

        const scored: FeedItem[] = posts.map((post: any) => ({
            type: 'post',
            post,
            createdAt: post.createdAt,
            score: this.calculateScore(post),
        }));

        const sorted = scored.sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });

        const offset = options.pagination?.offset ?? 0;
        const limit = options.pagination?.limit ?? 20;

        return sorted.slice(offset, offset + limit);
    }
}

export default new FeedService();
