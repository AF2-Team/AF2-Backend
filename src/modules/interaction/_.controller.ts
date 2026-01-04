import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import InteractionService from './interaction.service.js';

class InteractionController extends ControllerBase {
    like = async (_req: Request, _res: Response) => {
        const user = this.getUser<{ userId: string }>();
        if (!user) {
            return this.throwValidationError('Unauthorized');
        }

        const postId = this.requireParam('postId');

        const result = await InteractionService.likePost(user.userId, postId);
        return this.created(result, 'Like processed');
    };

    comment = async (_req: Request, _res: Response) => {
        const user = this.getUser<{ userId: string }>();
        if (!user) {
            return this.throwValidationError('Unauthorized');
        }

        const postId = this.requireParam('postId');
        const text = this.requireBodyField('text');

        const result = await InteractionService.commentPost(user.userId, postId, text);
        return this.created(result, 'Comment created');
    };

    comments = async (_req: Request, _res: Response) => {
        const postId = this.requireParam('postId');
        const options = this.getQueryFilters();

        const result = await InteractionService.getComments(postId, options);
        return this.success(result);
    };
}

export default new InteractionController();
