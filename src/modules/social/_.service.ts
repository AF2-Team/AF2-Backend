import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import NotificationService from '../notification/_.service.js';

class SocialService extends BaseService {
     async likePost(userId: string, postId: string) {
            const interactionRepo = Database.repository('main', 'interaction') as unknown as any;
    
            const postRepo = Database.repository('main', 'post') as unknown as any;
    
            const exists = await interactionRepo.exists({
                user: userId,
                post: postId,
                type: 'like',
            });
    
            if (exists) return { liked: true };
    
            await interactionRepo.create({
                user: userId,
                post: postId,
                type: 'like',
                status: 1,
            });
    
            await postRepo.incrementCounters(postId, 'likesCount', 1);
    
            const post = await postRepo.getById(postId);
            if (post) {
                await NotificationService.notify({
                    user: post.user,
                    actor: userId,
                    type: 'like',
                    entityId: postId,
                });
            }
    
            return { liked: true };
        }
    
    async commentPost(userId: string, postId: string, text: string) {
            this.validateRequired({ text }, ['text']);
    
            const interactionRepo = Database.repository('main', 'interaction') as unknown as any;
    
            const postRepo = Database.repository('main', 'post') as unknown as any;
    
            const comment = await interactionRepo.create({
                user: userId,
                post: postId,
                type: 'comment',
                text,
                status: 1,
            });
    
            await postRepo.incrementCounters(postId, 'commentsCount', 1);
    
            const post = await postRepo.getById(postId);
            if (post) {
                await NotificationService.notify({
                    user: post.user,
                    actor: userId,
                    type: 'comment',
                    entityId: postId,
                });
            }
    
            return comment;
    }
    
    async getComments(postId: string, options: any) {
            const interactionRepo = Database.repository('main', 'interaction') as unknown as any;
    
            return interactionRepo.getComments(postId, options);
    }

    async followUser(followerId: string, targetUserId: string) {
        if (followerId === targetUserId) {
                   throw new Error('User cannot follow itself');
                }
        
            const followRepo = Database.repository('main', 'follow') as any;
        
            const exists = await followRepo.exists(followerId, targetUserId, 'user');
        
        if (exists) return { followed: true };
        
            await followRepo.create({
                    follower: followerId,
                    target: targetUserId,
                    targetType: 'user',
                    status: 1,
            });
        
            await NotificationService.notify({
                    user: targetUserId,
                    actor: followerId,
                    type: 'follow',
                    entityId: followerId,
            });
        
            return { followed: true };
        }
         
        async unfollowUser(followerId: string, targetUserId: string) {
            const followRepo = Database.repository('main', 'follow') as any;
        
            const removed = await followRepo.remove(followerId, targetUserId, 'user');
        
            return { unfollowed: removed };
        }
}


export default new SocialService();