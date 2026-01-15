import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class SearchService extends BaseService {
    private getUserRepo() {
        return Database.repository('main', 'user');
    }

    private getPostRepo() {
        return Database.repository('main', 'post');
    }

    private getTagRepo() {
        return Database.repository('main', 'tag');
    }

    private getFollowRepo() {
        return Database.repository('main', 'follow');
    }

    private getSearchHistoryRepo() {
        return Database.repository('main', 'search-history');
    }

    async search(query: string, type: string, userId: string | undefined, options: ProcessedQueryFilters) {
        const q = query ? String(query).trim() : '';

        if (!q || q.length < 2) {
            return this.getEmptyResult();
        }

        if (userId) {
            await this.saveSearchHistory(userId, q, type);
        }

        const [users, posts, tags] = await Promise.all([
            type === 'user' || type === 'all' ? this.searchProfiles(q, options, userId) : [],
            type === 'post' || type === 'all' ? this.searchPostsAndReposts(q, options, userId) : [],
            type === 'tag' || type === 'all' ? this.searchTagsWithSuggestions(q, options) : [],
        ]);

        return {
            users: await this.rankProfiles(users, userId),
            posts: await this.rankPosts(posts, userId),
            tags: await this.rankTags(tags),
            suggestions: type === 'all' ? await this.getSearchSuggestions(q) : [],
        };
    }

    private getEmptyResult() {
        return {
            users: [],
            posts: [],
            tags: [],
            suggestions: [],
        };
    }

    private async searchProfiles(query: string, options: ProcessedQueryFilters, searcherId?: string) {
        const userRepo = this.getUserRepo();

        return userRepo.getAllActive(options, {
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } },
                { bio: { $regex: query, $options: 'i' } },
                { 'q.name': query },
            ],
            status: 1,
        });
    }

    private async searchPostsAndReposts(query: string, options: ProcessedQueryFilters, userId?: string) {
        const postRepo = this.getPostRepo();

        const byText = await postRepo.getAllActive(
            {
                ...options,
                pagination: { ...options.pagination, limit: (options.pagination?.limit || 20) * 2 },
            },
            {
                $or: [{ text: { $regex: query, $options: 'i' } }, { 'q.text': query }],
                publishStatus: 'published',
                status: 1,
            },
        );

        const normalizedQuery = query.toLowerCase();
        const byTag = await postRepo.getAllActive(
            {
                ...options,
                pagination: { ...options.pagination, limit: (options.pagination?.limit || 20) * 2 },
            },
            {
                tags: normalizedQuery,
                publishStatus: 'published',
                status: 1,
            },
        );

        const postMap = new Map<string, any>();
        [...byText, ...byTag].forEach((post) => {
            if (post && post.id) {
                postMap.set(post.id.toString(), post);
            }
        });

        return Array.from(postMap.values());
    }

    private async searchTagsWithSuggestions(query: string, options: ProcessedQueryFilters) {
        const tagRepo = this.getTagRepo();

        const exactTags = await tagRepo.getAllActive(options, {
            $or: [{ name: { $regex: `^${query}$`, $options: 'i' } }, { normalized: query.toLowerCase() }],
            status: 1,
        });

        const similarTags = await tagRepo.getAllActive(
            {
                ...options,
                pagination: { limit: 10 },
            },
            {
                $or: [{ name: { $regex: query, $options: 'i' } }, { normalized: { $regex: query, $options: 'i' } }],
                status: 1,
                postsCount: { $gt: 0 },
            },
        );

        return [...exactTags, ...similarTags];
    }

    private async rankProfiles(users: any[], searcherId?: string) {
        if (!users.length) return [];

        if (searcherId) {
            const followRepo = this.getFollowRepo();
            const followedUsers = await followRepo.getAllActive(
                {},
                {
                    follower: searcherId,
                    targetModel: 'User',
                    status: 1,
                },
            );

            const followedIds = followedUsers.map((f) => f.target?.toString()).filter(Boolean);

            return users.sort((a, b) => {
                const aIsFollowed = followedIds.includes(a._id.toString());
                const bIsFollowed = followedIds.includes(b._id.toString());

                if (aIsFollowed && !bIsFollowed) return -1;
                if (!aIsFollowed && bIsFollowed) return 1;

                const aFollowers = a.followersCount || 0;
                const bFollowers = b.followersCount || 0;

                return bFollowers - aFollowers;
            });
        }

        return users;
    }

    private async rankPosts(posts: any[], userId?: string) {
        if (!posts.length) return [];

        return posts.sort((a, b) => {
            const aScore = (a.likesCount || 0) + (a.commentsCount || 0) * 2 + (a.repostsCount || 0) * 1.5;
            const bScore = (b.likesCount || 0) + (b.commentsCount || 0) * 2 + (b.repostsCount || 0) * 1.5;

            if (bScore !== aScore) return bScore - aScore;

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }

    private async rankTags(tags: any[]) {
        if (!tags.length) return [];

        const uniqueTags = Array.from(new Map(tags.map((tag) => [tag.normalized, tag])).values());

        return uniqueTags.sort((a, b) => {
            return (b.postsCount || 0) - (a.postsCount || 0);
        });
    }

    private async getSearchSuggestions(query: string) {
        if (query.length < 2) return [];

        const tagRepo = this.getTagRepo();

        const relatedTags = await tagRepo.getAllActive(
            {
                pagination: { limit: 5 },
            },
            {
                $or: [{ name: { $regex: query, $options: 'i' } }, { normalized: { $regex: query, $options: 'i' } }],
                status: 1,
                postsCount: { $gt: 5 },
            },
        );

        return relatedTags.map((tag) => ({
            type: 'tag',
            name: tag.name,
            normalized: tag.normalized,
            postsCount: tag.postsCount,
        }));
    }

    private async saveSearchHistory(userId: string, query: string, type: string) {
        try {
            const historyRepo = this.getSearchHistoryRepo();

            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            const existing = await historyRepo.getOne({
                user: userId,
                query,
                type,
                createdAt: { $gt: fiveMinutesAgo },
                status: 1,
            });

            if (!existing) {
                await historyRepo.create({
                    user: userId,
                    query,
                    type,
                    createdAt: new Date(),
                    status: 1,
                });
            }
        } catch (error) {
            // Silenciar errores de historial
        }
    }

    async getSearchHistory(userId: string) {
        this.validateRequired({ userId }, ['userId']);

        const historyRepo = this.getSearchHistoryRepo();
        return historyRepo.getAllActive(
            {
                order: [['createdAt', 'desc']],
                pagination: { limit: 20 },
            },
            {
                user: userId,
                status: 1,
            },
        );
    }

    async clearSearchHistory(userId: string) {
        this.validateRequired({ userId }, ['userId']);

        const historyRepo = this.getSearchHistoryRepo();

        const historyItems = await historyRepo.getAllActive(
            {},
            {
                user: userId,
                status: 1,
            },
        );

        for (const item of historyItems) {
            await historyRepo.update(item._id.toString(), { status: 0 });
        }

        return true;
    }
}

export default new SearchService();
