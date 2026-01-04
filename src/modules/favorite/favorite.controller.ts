import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import FavoriteService from './favorite.service.js';

class FavoriteController extends ControllerBase {
    add = async (req: Request, res: Response) => {
        const userId = req.user?.id ?? req.body.userId;
        const { postId } = req.params;

        const result = await FavoriteService.add(userId, postId);
        this.created(result, 'Post favorited');
    };

    remove = async (req: Request, res: Response) => {
        const userId = req.user?.id ?? req.body.userId;
        const { postId } = req.params;

        const result = await FavoriteService.remove(userId, postId);
        this.success(result);
    };

    list = async (req: Request, res: Response) => {
        const { userId } = req.params;
        const options = this.getQueryFilters();

        const result = await FavoriteService.list(userId, options);
        this.success(result);
    };
}

export default new FavoriteController();
