import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import FeedService from './_.service.js';

class FeedController extends ControllerBase {
    get = async (_req: Request, _res: Response) => {
        const userId = this.getUser()?.id;
        const options = this.getQueryFilters();

        const result = await FeedService.getFeed(userId, options);
        return this.success(result);
    };
}

export default new FeedController();
