import { ControllerBase } from '@bases/controller.base.js';
import InteractionService from './_.service.js';

class InteractionController extends ControllerBase {
    like = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const postId = this.requireParam('postId');
        const result = await InteractionService.like(user._id, postId);

        return this.created(result, 'Post liked');
    };

    unlike = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const postId = this.requireParam('postId');
        const result = await InteractionService.unlike(user._id, postId);

        return this.success(result);
    };

    comment = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const postId = this.requireParam('postId');
        const text = this.requireBodyField('text');

        const result = await InteractionService.comment(user._id, postId, text);
        return this.created(result, 'Comment created');
    };

    comments = async () => {
        const postId = this.requireParam('postId');
        const options = this.getQueryFilters();

        const result = await InteractionService.getComments(postId, options);
        return this.success(result);
    };

    repost = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const postId = this.requireParam('postId');
        const result = await InteractionService.repost(user._id, postId);

        return this.created(result, 'Repost registered');
    };
}

export default new InteractionController();
