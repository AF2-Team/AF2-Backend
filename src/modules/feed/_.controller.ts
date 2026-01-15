import { ControllerBase } from '@bases/controller.base.js';
import FeedService from './_.service.js';

class FeedController extends ControllerBase {
    async get() {
        const user = this.getUser<{ _id: string }>();
        const options = this.getQueryFilters();

        const result = await FeedService.getFeed(user?._id, options);
        this.success(result);
    }

    async tags() {
        const user = this.getUser<{ _id: string }>();
        const options = this.getQueryFilters();

        const result = await FeedService.getTagFeed(user?._id, options);
        this.success(result);
    }
}

export default new FeedController();
