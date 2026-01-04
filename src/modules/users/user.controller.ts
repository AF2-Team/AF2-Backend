import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import UserService from './user.service.js';

class UserController extends ControllerBase {
    following = async (req: Request, res: Response) => {
        const { userId } = req.params;
        const options = this.getQueryFilters();

        const result = await UserService.getFollowing(userId, options);
        return this.success(result);
    };

    followers = async (req: Request, res: Response) => {
        const { userId } = req.params;
        const options = this.getQueryFilters();

        const result = await UserService.getFollowers(userId, options);
        return this.success(result);
    };

    profile = async (req: Request, res: Response) => {
        const { userId } = req.params;
        const viewerId = req.user?.id;

        const result = await UserService.getProfile(userId, viewerId);

        if (!result) {
            this.throwValidationError('User not found');
        }

        return this.success(result);
    };
}

export default new UserController();
