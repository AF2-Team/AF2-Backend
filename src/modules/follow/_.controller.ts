import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import FollowService from './follow.service.js';

class FollowController extends ControllerBase {
    follow = async (req: Request, res: Response) => {
        const followerId = req.user?.id ?? req.body.followerId;
        const { targetUserId } = req.body;

        if (!followerId) return this.unauthorized(res);

        const result = await FollowService.followUser(followerId, targetUserId);
        return this.created(res, result, 'Followed successfully');
    };

    unfollow = async (req: Request, res: Response) => {
        const followerId = req.user?.id ?? req.body.followerId;
        const { targetUserId } = req.body;

        if (!followerId) return this.unauthorized(res);

        const result = await FollowService.unfollowUser(followerId, targetUserId);
        return this.success(res, result);
    };
}

export default new FollowController();
