import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';
import SearchHistoryRepository from '@database/repositories/main/searchHistory.repository.js';

interface SearchResult {
    users: any[];
    posts: any[];
    tags: any[];
    suggestions: any[];
}

interface SuggestionItem {
    type: 'tag' | 'user';
    name?: string;
    normalized?: string;
    postsCount?: number;
    username?: string;
    avatarUrl?: string | null;
    matchType: 'exact' | 'partial';
}

class SearchService extends BaseService {
    private getUserRepo() {
        return Database.repository('main', 'user');
    }

    private getPostRepo() {
        return Database.repository('main', 'post');
    }

    private getFollowRepo() {
        return Database.repository('main', 'follow');
    }

    private getSearchHistoryRepo() {
        return SearchHistoryRepository;
    }

    async search(query: string, type: string, userId: string | undefined, options: ProcessedQueryFilters) {
        const q = query ? String(query).trim() : '';

        if (!q || q.length < 2) {
            return this.getEmptyResult();
        }

        const validTypes = ['user', 'post', 'tag', 'all'] as const;
        const searchType = validTypes.includes(type as any) ? type : 'all';

        if (userId) {
            await this.saveSearchHistory(userId, q, searchType);
        }

        const normalizedQuery = q.toLowerCase();

        const [users, posts, tags] = await Promise.all([
            searchType === 'user' || searchType === 'all' ? this.searchProfiles(normalizedQuery, options, userId) : [],
            searchType === 'post' || searchType === 'all'
                ? this.searchPostsAndReposts(normalizedQuery, options, userId)
                : [],
            searchType === 'tag' || searchType === 'all' ? this.searchTagsFromPosts(normalizedQuery, options) : [],
        ]);

        return {
            users: await this.rankProfiles(users, userId, normalizedQuery),
            posts: await this.rankPosts(posts, userId, normalizedQuery),
            tags: await this.rankTags(tags, normalizedQuery),
            suggestions: searchType === 'all' ? await this.getSearchSuggestions(normalizedQuery) : [],
        };
    }

    private getEmptyResult(): SearchResult {
        return {
            users: [],
            posts: [],
            tags: [],
            suggestions: [],
        };
    }

    private async searchProfiles(query: string, options: ProcessedQueryFilters, searcherId?: string): Promise<any[]> {
        const userRepo = this.getUserRepo();

        const users = await userRepo.getAllActive(
            {
                pagination: options.pagination,
                order: options.order,
            },
            {
                $or: [
                    { username: { $regex: query, $options: 'i' } },
                    { name: { $regex: query, $options: 'i' } },
                    { bio: { $regex: query, $options: 'i' } },
                ],
                status: 1,
            },
        );

        return users.map((user) => ({
            id: user._id || user.id,
            username: user.username,
            name: user.name,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            followersCount: user.followersCount || 0,
            followingCount: user.followingCount || 0,
            createdAt: user.createdAt,
            status: user.status,
        }));
    }

    private async searchPostsAndReposts(
        query: string,
        options: ProcessedQueryFilters,
        userId?: string,
    ): Promise<any[]> {
        const postRepo = this.getPostRepo();

        const byExactTag = await postRepo.getAllActive(
            {
                pagination: { limit: 20 },
                order: options.order,
            },
            {
                tags: query,
                publishStatus: 'published',
                status: 1,
            },
        );

        const byText = await postRepo.getAllActive(
            {
                pagination: { limit: 20 },
                order: options.order,
            },
            {
                text: { $regex: query, $options: 'i' },
                publishStatus: 'published',
                status: 1,
            },
        );

        const byPartialTag = await postRepo.getAllActive(
            {
                pagination: { limit: 10 },
                order: options.order,
            },
            {
                tags: { $regex: query, $options: 'i' },
                publishStatus: 'published',
                status: 1,
            },
        );

        const allPosts = [...byExactTag, ...byText, ...byPartialTag];
        const postMap = new Map<string, any>();

        allPosts.forEach((post) => {
            if (post && post.id) {
                const score = this.calculatePostRelevance(post, query);
                post._relevanceScore = score;
                postMap.set(post.id.toString(), post);
            }
        });

        const postsArray = Array.from(postMap.values());
        const limit = options.pagination?.limit || 20;
        const offset = options.pagination?.offset || 0;

        return postsArray.slice(offset, offset + limit);
    }

    private calculatePostRelevance(post: any, query: string): number {
        let score = 0;
        const text = post.text?.toLowerCase() || '';
        const tags = post.tags || [];

        if (tags.includes(query)) {
            score += 1000;
        }

        const words = text.split(/\s+/);
        if (words.includes(query)) {
            score += 500;
        }

        if (text.startsWith(query)) {
            score += 300;
        }

        if (text.includes(query)) {
            score += 100;
        }

        if (tags.some((tag: string) => tag.includes(query))) {
            score += 150;
        }

        score += (post.likesCount || 0) * 2;
        score += (post.commentsCount || 0) * 3;
        score += (post.repostsCount || 0) * 2;

        const daysOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) {
            score += Math.max(0, 50 - daysOld * 5);
        }

        return score;
    }

    private async searchTagsFromPosts(query: string, options: ProcessedQueryFilters): Promise<any[]> {
        const postRepo = this.getPostRepo();

        const postsWithTags = await postRepo.getAllActive(
            {
                pagination: { limit: 50 },
                order: options.order,
            },
            {
                $or: [{ tags: query }, { tags: { $regex: query, $options: 'i' } }],
                publishStatus: 'published',
                status: 1,
            },
        );

        const tagCountMap = new Map<string, number>();
        postsWithTags.forEach((post: any) => {
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach((tag: string) => {
                    const normalizedTag = tag.toLowerCase();
                    if (normalizedTag.includes(query)) {
                        tagCountMap.set(normalizedTag, (tagCountMap.get(normalizedTag) || 0) + 1);
                    }
                });
            }
        });

        const tags = Array.from(tagCountMap.entries()).map(([normalized, postsCount]) => ({
            name: normalized,
            normalized,
            postsCount,
            _relevanceScore: this.calculateTagRelevanceFromSearch(normalized, query, postsCount),
        }));

        const limit = options.pagination?.limit || 10;
        const offset = options.pagination?.offset || 0;

        return tags.slice(offset, offset + limit);
    }

    private calculateTagRelevanceFromSearch(tag: string, query: string, postsCount: number): number {
        let score = 0;

        if (tag === query) {
            score += 1000;
        }

        if (tag.startsWith(query)) {
            score += 500;
        }

        if (tag.includes(query)) {
            score += 200;
        }

        score += postsCount * 10;

        return score;
    }

    private async rankProfiles(users: any[], searcherId?: string, query?: string): Promise<any[]> {
        if (!users.length) return [];

        users.sort((a, b) => {
            if (!query) return 0;

            const aUsername = (a.username || '').toLowerCase();
            const bUsername = (b.username || '').toLowerCase();
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();

            if (aUsername === query && bUsername !== query) return -1;
            if (aUsername !== query && bUsername === query) return 1;

            if (aName === query && bName !== query) return -1;
            if (aName !== query && bName === query) return 1;

            const aFollowers = a.followersCount || 0;
            const bFollowers = b.followersCount || 0;
            if (bFollowers !== aFollowers) {
                return bFollowers - aFollowers;
            }

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return users;
    }

    private async rankPosts(posts: any[], userId?: string, query?: string): Promise<any[]> {
        if (!posts.length) return [];

        return posts.sort((a, b) => {
            if (b._relevanceScore !== a._relevanceScore) {
                return b._relevanceScore - a._relevanceScore;
            }

            const aEngagement = (a.likesCount || 0) + (a.commentsCount || 0) * 2 + (a.repostsCount || 0) * 1.5;
            const bEngagement = (b.likesCount || 0) + (b.commentsCount || 0) * 2 + (b.repostsCount || 0) * 1.5;

            if (bEngagement !== aEngagement) {
                return bEngagement - aEngagement;
            }

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }

    private async rankTags(tags: any[], query?: string): Promise<any[]> {
        if (!tags.length) return [];

        return tags.sort((a, b) => {
            if (b._relevanceScore !== a._relevanceScore) {
                return b._relevanceScore - a._relevanceScore;
            }

            return (b.postsCount || 0) - (a.postsCount || 0);
        });
    }

    private async getSearchSuggestions(query: string): Promise<SuggestionItem[]> {
        if (query.length < 2) return [];

        const postRepo = this.getPostRepo();
        const userRepo = this.getUserRepo();

        const postsWithTags = await postRepo.getAllActive(
            {
                pagination: { limit: 20 },
            },
            {
                tags: { $regex: `^${query}`, $options: 'i' },
                publishStatus: 'published',
                status: 1,
            },
        );

        const tagCountMap = new Map<string, number>();
        postsWithTags.forEach((post: any) => {
            if (post.tags) {
                post.tags.forEach((tag: string) => {
                    const normalizedTag = tag.toLowerCase();
                    if (normalizedTag.startsWith(query)) {
                        tagCountMap.set(normalizedTag, (tagCountMap.get(normalizedTag) || 0) + 1);
                    }
                });
            }
        });

        const relatedTags = Array.from(tagCountMap.entries())
            .map(([name, postsCount]) => ({ name, normalized: name, postsCount }))
            .sort((a, b) => b.postsCount - a.postsCount)
            .slice(0, 5);

        const relatedUsers = await userRepo.getAllActive(
            {
                pagination: { limit: 3 },
            },
            {
                $or: [
                    { username: { $regex: `^${query}`, $options: 'i' } },
                    { name: { $regex: `^${query}`, $options: 'i' } },
                ],
                status: 1,
            },
        );

        const suggestions: SuggestionItem[] = [];

        relatedTags.forEach((tag) => {
            suggestions.push({
                type: 'tag',
                name: tag.name,
                normalized: tag.normalized,
                postsCount: tag.postsCount,
                matchType: tag.normalized === query ? 'exact' : 'partial',
            });
        });

        relatedUsers.forEach((user: any) => {
            suggestions.push({
                type: 'user',
                username: user.username,
                name: user.name,
                avatarUrl: user.avatarUrl,
                matchType: user.username?.toLowerCase() === query ? 'exact' : 'partial',
            });
        });

        return suggestions;
    }

    private async saveSearchHistory(userId: string, query: string, type: string): Promise<void> {
        try {
            const historyRepo = this.getSearchHistoryRepo();

            const hasRecent = await historyRepo.hasRecentSearch(userId, query, type, 5);

            if (!hasRecent) {
                await historyRepo.create({
                    user: userId,
                    query,
                    type,
                    createdAt: new Date(),
                    status: 1,
                } as any);
            }
        } catch (error) {
            // Silenciar errores
        }
    }

    async clearSearchHistory(userId: string): Promise<boolean> {
        this.validateRequired({ userId }, ['userId']);

        const historyRepo = this.getSearchHistoryRepo();

        return await historyRepo.clearUserHistory(userId);
    }

    async getSearchHistory(userId: string): Promise<any[]> {
        this.validateRequired({ userId }, ['userId']);

        const historyRepo = this.getSearchHistoryRepo();

        return await historyRepo.getByUser(userId, {
            order: [['createdAt', 'desc']],
            pagination: { limit: 20 },
        });
    }
}

export default new SearchService();
