import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import SearchService from './_.service.js';

class SearchController extends ControllerBase {
    search = async (_req: Request, _res: Response) => {
        const q = String(this.getQuery().q ?? '');
        const type = String(this.getQuery().type ?? 'all');
        const userId = this.getUser()?.id;

        const options = this.getQueryFilters();
        const result = await SearchService.search(q, type, userId, options);

        return this.success(result);
    };

    history = async () => {
        const user = this.getUser<{ id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const result = await SearchService.getHistory(user.id);
        return this.success(result);
    };

    clearHistory = async () => {
        const user = this.getUser<{ id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        await SearchService.clearHistory(user.id);
        return this.success({ cleared: true });
    };
}

export default new SearchController();
