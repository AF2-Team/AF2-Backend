import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import SearchService from './_.service.js';

class SearchController extends ControllerBase {
    search = async (req: Request, res: Response) => {
        const { q } = req.query;

        const options = this.getQueryFilters();
        const result = await SearchService.search(String(q ?? ''), options);

        return this.success(result);
    };
}

export default new SearchController();
