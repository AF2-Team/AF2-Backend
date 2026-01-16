import { ControllerBase } from '@bases/controller.base.js';
import SearchService from './_.service.js';
import { AuthError } from '@errors/auth.error.js';

class SearchController extends ControllerBase {
    
    // 1. Búsqueda Global (Todo)
    search = async () => {
        const { q } = this.getQuery();
        const userId = this.getUser<{ _id: string } | null>()?._id;
        const options = this.getQueryFilters ? this.getQueryFilters() : { pagination: { limit: 20 }, order: [['createdAt', 'desc']] };

        const result = await SearchService.search(String(q || ''), 'all', userId, options as any);
        this.success(result);
    };

    // 2. Buscar Usuarios (Wrapper para Android)
    searchUsers = async () => {
        const { q } = this.getQuery();
        const userId = this.getUser<{ _id: string } | null>()?._id;
        const options = this.getQueryFilters ? this.getQueryFilters() : { pagination: { limit: 20 } };

        // Pedimos solo 'user' al servicio
        const result = await SearchService.search(String(q || ''), 'user', userId, options as any);
        // Devolvemos solo el array de usuarios
        this.success(result.users);
    };

    // 3. Buscar Posts (Wrapper para Android)
    searchPosts = async () => {
        const { q } = this.getQuery();
        const userId = this.getUser<{ _id: string } | null>()?._id;
        const options = this.getQueryFilters ? this.getQueryFilters() : { pagination: { limit: 20 } };

        const result = await SearchService.search(String(q || ''), 'post', userId, options as any);
        this.success(result.posts);
    };

    // 4. Buscar Tags (Wrapper para Android)
    searchTags = async () => {
        const { q } = this.getQuery();
        const options = this.getQueryFilters ? this.getQueryFilters() : { pagination: { limit: 20 } };

        const result = await SearchService.search(String(q || ''), 'tag', undefined, options as any);
        this.success(result.tags);
    };

    // Historial (Mantén tu código original)
    getHistory = async () => {
        const user = this.getUser<{ _id: string }>();
        const result = await SearchService.getHistory(user._id);
        this.success(result);
    };

    clearHistory = async () => {
        const user = this.getUser<{ _id: string }>();
        await SearchService.clearHistory(user._id);
        this.success({ cleared: true });
    };
}

export default new SearchController();