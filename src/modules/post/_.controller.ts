import { ControllerBase } from '@bases/controller.base.js';
import PostService from './_.service.js';

class PostController extends ControllerBase {
    create = async () => {
        const body = this.getBody();
        const user = this.getUser<{ _id: string }>();

        if (!user) this.throwValidationError('Unauthorized');

        const result = await PostService.createPost({
            ...body,
            user: user._id,
        });

        return this.created(result, 'Post created');
    };

    getById = async () => {
        const postId = this.requireParam('id');
        const result = await PostService.getById(postId);

        if (!result) this.throwValidationError('Post not found');
        return this.success(result);
    };

    update = async () => {
        const postId = this.requireParam('id');
        const body = this.getBody();
        const user = this.getUser<{ _id: string }>();

        if (!user) this.throwValidationError('Unauthorized');

        const result = await PostService.updatePost(postId, user._id, body);
        return this.success(result, 'Post updated');
    };

    delete = async () => {
        const postId = this.requireParam('id');
        const user = this.getUser<{ _id: string }>();

        if (!user) this.throwValidationError('Unauthorized');

        await PostService.deletePost(postId, user._id);
        return this.noContent('Post deleted');
    };

    uploadMedia = async () => {
        const postId = this.requireParam('id');
        const user = this.getUser<{ _id: string }>();
        const req = this.getRequest();

        if (!user) this.throwValidationError('Unauthorized');
        if (!req.file) this.throwValidationError('Media file required');

        const result = await PostService.addMedia(postId, user._id, req.file);
        return this.success(result, 'Media uploaded');
    };

    repost = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const postId = this.requireParam('id');
        const result = await PostService.repost(user._id, postId);
        return this.created(result, 'Repost created');
    };

    reposts = async () => {
        const postId = this.requireParam('id');
        const options = this.getQueryFilters();

        const result = await PostService.getReposts(postId, options);
        return this.success(result);
    };

    likes = async () => {
        const postId = this.requireParam('id');
        return this.success(await PostService.getLikes(postId));
    };

    interactions = async () => {
        const postId = this.requireParam('id');
        return this.success(await PostService.getInteractions(postId));
    };

    feed = async () => {
        const options = this.getQueryFilters();
        return this.success(await PostService.getFeed(options));
    };

    combinedFeed = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const options = this.getQueryFilters();
        return this.success(await PostService.getCombinedFeed(user._id, options));
    };

    byUser = async () => {
        const userId = this.requireParam('userId');
        const options = this.getQueryFilters();
        return this.success(await PostService.getByUser(userId, options));
    };

    byTag = async () => {
        const tag = this.requireParam('tag');
        const options = this.getQueryFilters();
        return this.success(await PostService.getByTag(tag, options));
    };

    tagInfo = async () => {
        const name = this.requireParam('name');
        const result = await PostService.getTagInfo(name);

        if (!result) this.throwValidationError('Tag not found');
        return this.success(result);
    };

    postsByTag = async () => {
        const name = this.requireParam('name');
        const options = this.getQueryFilters();

        return this.success(await PostService.getPostsByTag(name, options));
    };

    trendingTags = async () => {
        const options = this.getQueryFilters();
        return this.success(await PostService.getTrendingTags(options));
    };
}

export default new PostController();
