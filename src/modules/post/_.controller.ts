import { ControllerBase } from '@bases/controller.base.js';
import PostService from './_.service.js';

class PostController extends ControllerBase {
    async createPost() {
        const user = this.getUser<{ _id: string }>();

        const body = this.getBody();
        const req = this.getRequest();
        const files = (req as any).files || [];

        const result = await PostService.createPost(
            {
                ...body,
                user: user!._id,
            },
            files,
        );

        this.created(result, 'Post created');
    }

    async getPost() {
        const postId = this.requireParam('id');
        const result = await PostService.getPostById(postId);

        this.success(result);
    }

    async updatePost() {
        const user = this.getUser<{ _id: string }>();

        const postId = this.requireParam('id');
        const body = this.getBody();

        const result = await PostService.updatePost(postId, user!._id, body);
        this.success(result, 'Post updated');
    }

    async deletePost() {
        const user = this.getUser<{ _id: string }>();

        const postId = this.requireParam('id');
        await PostService.deletePost(postId, user!._id);

        this.success({ id: postId }, 'Post deleted');
    }

    async uploadPostMedia() {
        const user = this.getUser<{ _id: string }>();

        const postId = this.requireParam('id');
        const req = this.getRequest();
        const file = (req as any).file;

        if (!file) throw new Error('Media file required');

        const result = await PostService.addMedia(postId, user!._id, file);
        this.success(result, 'Media uploaded');
    }

    async createRepost() {
        const user = this.getUser<{ _id: string }>();

        const postId = this.requireParam('id');
        const result = await PostService.createRepost(user!._id, postId);

        this.created(result, 'Repost created');
    }

    async getPostReposts() {
        const postId = this.requireParam('id');
        const options = this.getQueryFilters();

        const result = await PostService.getReposts(postId, options);
        this.success(result);
    }

    async getPostInteractions() {
        const postId = this.requireParam('id');

        const result = await PostService.getInteractions(postId);
        this.success(result);
    }

    async getPostsByUser() {
        const userId = this.requireParam('userId');
        const options = this.getQueryFilters();

        const result = await PostService.getPostsByUser(userId, options);
        this.success(result);
    }

    async getPostsByTag() {
        const tag = this.requireParam('tag');
        const options = this.getQueryFilters();

        const result = await PostService.getPostsByTag(tag, options);
        this.success(result);
    }

    async getTagInfo() {
        const name = this.requireParam('name');
        const result = await PostService.getTagInfo(name);

        this.success(result);
    }

    async getTrendingTags() {
        const options = this.getQueryFilters();
        const result = await PostService.getTrendingTags(options);
        this.success(result);
    }
}

export default new PostController();
