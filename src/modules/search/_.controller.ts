import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import SearchService from './search.service.js';

class SearchController extends ControllerBase {
    search = async (req: Request, res: Response) => {
        const { q } = req.query;

        const options = this.getQueryFilters(req);
        const result = await SearchService.search(String(q || ''), options);

        return this.success(res, result);
    };
}

export default new SearchController();
