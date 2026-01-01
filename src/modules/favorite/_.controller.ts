import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import FavoriteService from './favorite.service.js';

class FavoriteController extends ControllerBase {
    add = async (req: Request, res: Response) => {
        const userId = req.user?.id ?? req.body.userId;
        const { postId } = req.params;

        const result = await FavoriteService.add(userId, postId);
        return this.created(res, result, 'Post favorited');
    };

    remove = async (req: Request, res: Response) => {
        const userId = req.user?.id ?? req.body.userId;
        const { postId } = req.params;

        const result = await FavoriteService.remove(userId, postId);
        return this.success(res, result);
    };

    list = async (req: Request, res: Response) => {
        const { userId } = req.params;
        const options = this.getQueryFilters(req);

        const result = await FavoriteService.list(userId, options);
        return this.success(res, result);
    };
}

export default new FavoriteController();
