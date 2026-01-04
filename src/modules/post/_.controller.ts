import { ControllerBase } from '@bases/controller.base.js';
import PostService from './_.service.js';

class PostController extends ControllerBase {
    create = async () => {
        const body = this.getBody();
        const result = await PostService.createPost(body);
        return this.created(result, 'Post created');
    };

    feed = async () => {
        const options = this.getQueryFilters();
        const result = await PostService.getFeed(options);
        return this.success(result);
    };

    byUser = async () => {
        const userId = this.requireParam('userId');
        const options = this.getQueryFilters();
        const result = await PostService.getByUser(userId, options);
        return this.success(result);
    };

    byTag = async () => {
        const tag = this.requireParam('tag');
        const options = this.getQueryFilters();
        const result = await PostService.getByTag(tag, options);
        return this.success(result);
    };

    combinedFeed = async () => {
        const user = this.getUser<{ userId: string }>();
        if (!user) {
            this.throwValidationError('Unauthorized');
        }

        const options = this.getQueryFilters();
        const result = await PostService.getCombinedFeed(user.userId, options);
        return this.success(result);
    };

    repost = async () => {
        const user = this.getUser<{ userId: string }>();
        if (!user) {
            this.throwValidationError('Unauthorized');
        }

        const postId = this.requireParam('postId');
        const result = await PostService.repost(user.userId, postId);
        return this.created(result, 'Repost created');
    };
}

export default new PostController();
