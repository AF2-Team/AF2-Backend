import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import FollowService from './_.service.js';

class FollowController extends ControllerBase {
    follow = async (req: Request, res: Response) => {
        const userId = (req as any).user?.userId;
        const { targetUserId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const result = await FollowService.followUser(userId, targetUserId);
        this.created(result, 'Followed successfully');
    };

    unfollow = async (req: Request, res: Response) => {
        const userId = (req as any).user?.userId;
        const { targetUserId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const result = await FollowService.unfollowUser(userId, targetUserId);
        this.success(result);
    };
}

export default new FollowController();
