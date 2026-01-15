import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
// Asegúrate de importar tus tipos correctamente según tu proyecto
import { ProcessedQueryFilters } from '@rules/api-query.type.js'; 

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
    private getUserRepo() { return Database.repository('main', 'user'); }
    private getPostRepo() { return Database.repository('main', 'post'); }
    private getFollowRepo() { return Database.repository('main', 'follow'); }
    private getHistoryRepo() { return Database.repository('main', 'history'); }

    // --- TU LÓGICA MAESTRA (Intacta) ---
    async search(
        query: string,
        type: string,
        userId: string | undefined,
        options: ProcessedQueryFilters,
    ): Promise<SearchResult> {
        const q = query ? String(query).trim() : '';

        // Si es muy corto, devolvemos vacío
        if (!q) {
            return this.getEmptyResult();
        }

        const validTypes = ['user', 'post', 'tag', 'all'] as const;
        const searchType = validTypes.includes(type as any) ? type : 'all';

        // Guardar historial (solo si hay usuario)
        if (userId) {
            await this.saveHistory(userId, q, searchType);
        }

        const normalizedQuery = q.toLowerCase();

        // Ejecutar búsquedas en paralelo
        const [users, posts, tags] = await Promise.all([
            searchType === 'user' || searchType === 'all' ? this.searchProfiles(normalizedQuery, options) : [],
            searchType === 'post' || searchType === 'all' ? this.searchPostsAndReposts(normalizedQuery, options) : [],
            searchType === 'tag' || searchType === 'all' ? this.searchTagsFromPosts(normalizedQuery, options) : [],
        ]);

        return {
            users: await this.rankProfiles(users, normalizedQuery),
            posts: await this.rankPosts(posts, normalizedQuery),
            tags: await this.rankTags(tags), // No pasamos query para ordenar por relevancia calculada
            suggestions: searchType === 'all' ? await this.getSearchSuggestions(normalizedQuery) : [],
        };
    }

    private getEmptyResult(): SearchResult {
        return { users: [], posts: [], tags: [], suggestions: [] };
    }

    // --- BÚSQUEDA DE PERFILES ---
    private async searchProfiles(query: string, options: ProcessedQueryFilters): Promise<any[]> {
        const userRepo = this.getUserRepo();
        // Quitamos @ para buscar
        const cleanQuery = query.replace('@', '');

        const users = await userRepo.getAllActive(
            {
                pagination: options.pagination,
                order: options.order,
            },
            {
                $or: [
                    { username: { $regex: cleanQuery, $options: 'i' } },
                    { name: { $regex: cleanQuery, $options: 'i' } },
                ],
                status: 1,
            },
        );

        // Mapeo seguro para Android
        return users.map((user: any) => ({
            id: user._id || user.id,
            username: user.username,
            name: user.name,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            followersCount: user.followersCount || 0,
            followingCount: user.followingCount || 0,
            postsCount: user.postsCount || 0,
            createdAt: user.createdAt,
            // Agregamos esto para evitar errores de serialización si faltan campos
            email: null 
        }));
    }

    // --- BÚSQUEDA DE POSTS (CON FIX DE POPULATE) ---
    private async searchPostsAndReposts(query: string, options: ProcessedQueryFilters): Promise<any[]> {
        const postRepo = this.getPostRepo();
        const cleanQuery = query.replace('#', ''); // Limpiamos hash si viene

        // 1. Buscar posts que coincidan
        const allPosts = await postRepo.getAllActive(
            {
                pagination: { limit: 50 }, // Traemos más para rankear mejor
            },
            {
                $or: [
                    { text: { $regex: cleanQuery, $options: 'i' } }, // Texto contiene query
                    { tags: cleanQuery } // Tag exacto
                ],
                publishStatus: 'published',
                status: 1,
            },
        );

        // [FIX CRÍTICO] POBLAR EL USUARIO
        // Esto es lo que faltaba en tu código original y causaba crash en Android
        if (allPosts.length > 0 && (postRepo as any).model) {
            await (postRepo as any).model.populate(allPosts, {
                path: 'user',
                select: 'name username avatarUrl'
            });
        }

        // Calcular relevancia
        const processedPosts = allPosts.map((post: any) => {
            // Asegurar objeto limpio
            const p = post.toObject ? post.toObject() : post;
            
            // Fix usuario si falta nombre
            if(p.user && !p.user.name) {
                p.user.name = p.user.username || 'Usuario';
            }

            p._relevanceScore = this.calculatePostRelevance(p, cleanQuery);
            return p;
        });

        // Paginación manual post-ranking (se hace en rankPosts)
        return processedPosts;
    }

    // --- CALCULAR RELEVANCIA (Tu algoritmo original) ---
    private calculatePostRelevance(post: any, query: string): number {
        let score = 0;
        const text = post.text?.toLowerCase() || '';
        const tags = post.tags || [];

        if (tags.includes(query)) score += 1000;
        if (text.startsWith(query)) score += 300;
        if (text.includes(query)) score += 100;

        score += (post.likesCount || 0) * 2;
        score += (post.commentsCount || 0) * 3;

        // Frescura (Posts recientes valen más)
        const daysOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) score += Math.max(0, 50 - daysOld * 5);

        return score;
    }

    // --- BÚSQUEDA DE TAGS (Tu lógica original) ---
    private async searchTagsFromPosts(query: string, options: ProcessedQueryFilters): Promise<any[]> {
        const postRepo = this.getPostRepo();
        const cleanQuery = query.replace('#', '');

        // Buscamos posts que contengan tags parecidos
        const postsWithTags = await postRepo.getAllActive(
            { pagination: { limit: 50 } },
            {
                tags: { $regex: cleanQuery, $options: 'i' },
                publishStatus: 'published',
                status: 1,
            },
        );

        const tagCountMap = new Map<string, number>();
        postsWithTags.forEach((post: any) => {
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach((tag: string) => {
                    const normalizedTag = tag.toLowerCase();
                    if (normalizedTag.includes(cleanQuery)) {
                        tagCountMap.set(normalizedTag, (tagCountMap.get(normalizedTag) || 0) + 1);
                    }
                });
            }
        });

        const tags = Array.from(tagCountMap.entries()).map(([name, postsCount]) => ({
            // [FIX] Android necesita un 'id'. Generamos uno falso basado en el nombre para tags dinámicos
            _id: `tag_${name}`, 
            id: `tag_${name}`,
            name: name,
            postsCount,
            _relevanceScore: postsCount * 10 + (name === cleanQuery ? 1000 : 0),
        }));

        return tags;
    }

    // --- RANKING (Ordenamiento) ---
    private async rankProfiles(users: any[], query: string): Promise<any[]> {
        return users.sort((a, b) => {
             // Si coincide exacto el username, va primero
             if (a.username.toLowerCase() === query && b.username.toLowerCase() !== query) return -1;
             return (b.followersCount || 0) - (a.followersCount || 0);
        });
    }

    private async rankPosts(posts: any[], query: string): Promise<any[]> {
        return posts.sort((a, b) => b._relevanceScore - a._relevanceScore);
    }

    private async rankTags(tags: any[]): Promise<any[]> {
        return tags.sort((a, b) => b._relevanceScore - a._relevanceScore);
    }

    // --- HISTORIAL Y SUGERENCIAS ---
    // (Mantén tus métodos getSearchSuggestions, saveHistory, getHistory, clearHistory tal cual los tenías)
    // ... Copia aquí el resto de tu código original ...
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

    private async saveHistory(userId: string, query: string, type: string): Promise<void> {
        try {
            const historyRepo = this.getHistoryRepo();

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

    async getHistory(userId: string): Promise<any[]> {
        // this.validateRequired({ userId }, ['userId']);

        const historyRepo = this.getHistoryRepo();
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

    async clearHistory(userId: string): Promise<boolean> {
        // this.validateRequired({ userId }, ['userId']);

        const historyRepo = this.getHistoryRepo();

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