import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import FeedService from './_.service.js';

class FeedController extends ControllerBase {
    async get() {
        const user = this.getUser<{ _id: string }>();
        const options = this.getQueryFilters();

        return this.success(await FeedService.getFeed(user?._id, options));
    }

    async tags() {
        const user = this.getUser<{ _id: string }>();
        const options = this.getQueryFilters();

        return this.success(await FeedService.getTagFeed(user?._id, options));
    }
}

export default new FeedController();
