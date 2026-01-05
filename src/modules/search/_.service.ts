import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class SearchService extends BaseService {
    async search(query: string, options: ProcessedQueryFilters) {
        if (!query || query.trim().length === 0) {
            return {
                users: [],
                posts: [],
                tags: [],
            };
        }

        const q = query.trim();
        const normalized = q.toLowerCase();

        const userRepo = Database.repository('main', 'user');
        const postRepo = Database.repository('main', 'post');
        const tagRepo = Database.repository('main', 'tag');

        const [users, postsByText, postsByTag, tags] = await Promise.all([
            userRepo.getAllActive(options, {
                'q.name': q,
            }),

            postRepo.getAllActive(options, {
                'q.text': q,
                publishStatus: 'published',
            }),

            postRepo.getAllActive(options, {
                tags: normalized,
                publishStatus: 'published',
            }),

            tagRepo.getAllActive(options, {
                'q.normalized': normalized,
            }),
        ]);

        const postsMap = new Map<string, any>();
        [...postsByText, ...postsByTag].forEach((post) => postsMap.set(post.id, post));

        return {
            users,
            posts: Array.from(postsMap.values()),
            tags,
        };
    }
}

export default new SearchService();
