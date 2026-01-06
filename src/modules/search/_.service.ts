import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class SearchService extends BaseService {
    async search(query: string, type: string, userId: string | undefined, options: ProcessedQueryFilters) {
        if (!query || query.trim().length === 0) {
            return { users: [], posts: [], tags: [] };
        }

        const q = query.trim();
        const normalized = q.toLowerCase();

        const userRepo = Database.repository('main', 'user');
        const postRepo = Database.repository('main', 'post');
        const tagRepo = Database.repository('main', 'tag');
        const historyRepo = Database.repository('main', 'searchHistory') as any;

        // 🕘 Guardar historial (si hay usuario)
        if (userId) {
            await historyRepo.create({
                user: userId,
                query: q,
                type,
                createdAt: new Date(),
            });
        }

        const result = {
            users: [],
            posts: [],
            tags: [],
        } as any;

        if (type === 'user' || type === 'all') {
            result.users = await userRepo.getAllActive(options, {
                'q.name': q,
            });
        }

        if (type === 'post' || type === 'all') {
            const [byText, byTag] = await Promise.all([
                postRepo.getAllActive(options, {
                    'q.text': q,
                    publishStatus: 'published',
                }),
                postRepo.getAllActive(options, {
                    tags: normalized,
                    publishStatus: 'published',
                }),
            ]);

            const map = new Map<string, any>();
            [...byText, ...byTag].forEach((p) => map.set(p.id, p));
            result.posts = Array.from(map.values());
        }

        if (type === 'tag' || type === 'all') {
            result.tags = await tagRepo.getAllActive(options, {
                'q.normalized': normalized,
            });
        }

        return result;
    }

    async getHistory(userId: string) {
        const historyRepo = Database.repository('main', 'searchHistory') as any;
        return historyRepo.getAll({ order: [['createdAt', 'desc']], pagination: { limit: 20 } }, { user: userId });
    }

    async clearHistory(userId: string) {
        const historyRepo = Database.repository('main', 'searchHistory') as any;
        await historyRepo.model.deleteMany({ user: userId });
        return true;
    }
}

export default new SearchService();
