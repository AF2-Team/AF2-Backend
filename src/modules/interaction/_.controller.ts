import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import InteractionService from './interaction.service.js';

class InteractionController extends ControllerBase {
    like = async (req: Request, res: Response) => {
        const userId = req.user?.id ?? req.body.userId;
        const { postId } = req.params;

        if (!userId) return this.unauthorized(res);

        const result = await InteractionService.likePost(userId, postId);
        return this.created(res, result, 'Like processed');
    };

    comment = async (req: Request, res: Response) => {
        const userId = req.user?.id ?? req.body.userId;
        const { text } = req.body;
        const { postId } = req.params;

        if (!userId) return this.unauthorized(res);

        const result = await InteractionService.commentPost(userId, postId, text);
        return this.created(res, result, 'Comment created');
    };

    comments = async (req: Request, res: Response) => {
        const { postId } = req.params;
        const options = this.getQueryFilters(req);

        const result = await InteractionService.getComments(postId, options);
        return this.success(res, result);
    };
}

export default new InteractionController();
