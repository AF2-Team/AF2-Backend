import { ControllerBase } from '@bases/controller.base.js';
import SearchService from './_.service.js';
import { AuthError } from '@errors/auth.error.js';

class SearchController extends ControllerBase {
    async search() {
        const q = String(this.getQuery().q ?? '');
        const type = String(this.getQuery().type ?? 'all');
        const user = this.getUser<{ _id: string }>();
        const userId = user?._id;

        const options = this.getQueryFilters();
        const result = await SearchService.search(q, type, userId, options);

        this.success(result);
    }

    async getSearchHistory() {
        const user = this.getUser<{ _id: string }>();
        const result = await SearchService.getSearchHistory(user!._id);
        this.success(result);
    }

    async clearSearchHistory() {
        const user = this.getUser<{ _id: string }>();
        await SearchService.clearSearchHistory(user!._id);
        this.success({ cleared: true });
    }
}

export default new SearchController();
