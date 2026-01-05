import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import SocialService from './_.service.js';

class SocialController extends ControllerBase {
       like = async (_req: Request, _res: Response) => {
            const user = this.getUser<{ userId: string }>();
            if (!user) {
                return this.throwValidationError('Unauthorized');
            }
    
            const postId = this.requireParam('postId');
    
            const result = await SocialService.likePost(user.userId, postId);
            return this.created(result, 'Like processed');
        };
    
        comment = async (_req: Request, _res: Response) => {
            const user = this.getUser<{ userId: string }>();
            if (!user) {
                return this.throwValidationError('Unauthorized');
            }
    
            const postId = this.requireParam('postId');
            const text = this.requireBodyField('text');
    
            const result = await SocialService.commentPost(user.userId, postId, text);
            return this.created(result, 'Comment created');
        };
    
        comments = async (_req: Request, _res: Response) => {
            const postId = this.requireParam('postId');
            const options = this.getQueryFilters();
    
            const result = await SocialService.getComments(postId, options);
            return this.success(result);
        };

         follow = async (req: Request, res: Response) => {
                const userId = (req as any).user?.userId;
                const { targetUserId } = req.body;
        
                if (!userId) {
                    return res.status(401).json({ success: false, message: 'Unauthorized' });
                }
        
                const result = await SocialService.followUser(userId, targetUserId);
                this.created(result, 'Followed successfully');
            };
        
            unfollow = async (req: Request, res: Response) => {
                const userId = (req as any).user?.userId;
                const { targetUserId } = req.body;
        
                if (!userId) {
                    return res.status(401).json({ success: false, message: 'Unauthorized' });
                }
        
                const result = await SocialService.unfollowUser(userId, targetUserId);
                this.success(result);
            };
        
        
}

export default new SocialController();