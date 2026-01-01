import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import UserService from './user.service.js';

class UserController extends ControllerBase {
    following = async (req: Request, res: Response) => {
        const { userId } = req.params;
        const options = this.getQueryFilters(req);

        const result = await UserService.getFollowing(userId, options);
        return this.success(res, result);
    };

    followers = async (req: Request, res: Response) => {
        const { userId } = req.params;
        const options = this.getQueryFilters(req);

        const result = await UserService.getFollowers(userId, options);
        return this.success(res, result);
    };

    profile = async (req: Request, res: Response) => {
        const { userId } = req.params;
        const viewerId = req.user?.id; // futuro auth

        const result = await UserService.getProfile(userId, viewerId);
        if (!result) return this.notFound(res, 'User not found');

        return this.success(res, result);
    };
}

export default new UserController();
