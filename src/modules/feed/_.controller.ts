import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import FeedService from './feed.service.js';

class FeedController extends ControllerBase {
    get = async (req: Request, res: Response) => {
        const userId = req.user?.id; // viene del auth middleware
        const options = this.getQueryFilters(req);

        const result = await FeedService.getFeed(userId, options);
        return this.success(res, result);
    };
}

export default new FeedController();
