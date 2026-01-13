import { ControllerBase } from '@bases/controller.base.js';
import InteractionService from './_.service.js';
import { AuthError } from '@errors/auth.error.js';

class InteractionController extends ControllerBase {
    async likePost() {
        const user = this.getUser<{ _id: string }>();
        if (!user) throw new AuthError('Unauthorized');

        const postId = this.requireParam('postId');
        const result = await InteractionService.likePost(user._id, postId);

        this.created(result, 'Post liked');
    }

    async unlikePost() {
        const user = this.getUser<{ _id: string }>();
        if (!user) throw new AuthError('Unauthorized');

        const postId = this.requireParam('postId');
        const result = await InteractionService.unlikePost(user._id, postId);

        this.success(result);
    }

    async createComment() {
        const user = this.getUser<{ _id: string }>();
        if (!user) throw new AuthError('Unauthorized');

        const postId = this.requireParam('postId');
        const text = this.requireBodyField('text');

        const result = await InteractionService.createComment(user._id, postId, text);
        this.created(result, 'Comment created');
    }

    async getComments() {
        const postId = this.requireParam('postId');
        const options = this.getQueryFilters();

        const result = await InteractionService.getComments(postId, options);
        this.success(result);
    }
}

export default new InteractionController();
