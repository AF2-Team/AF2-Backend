import { ControllerBase } from '@bases/controller.base.js';
import FollowService from './_.service.js';

class FollowController extends ControllerBase {
    followUser = async () => {
        const user = this.getUser<{ _id: string }>();
        const targetUserId = this.requireParam('userId');

         if (!user) this.throwValidationError('Unauthorized');

        if (user._id === targetUserId) {
            return this.throwValidationError('You cannot follow yourself');
        }

        const result = await FollowService.followUser(user._id, targetUserId);

        return this.created(result, 'User followed');
    };

    unfollowUser = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const targetUserId = this.requireParam('userId');
        const result = await FollowService.unfollowUser(user._id, targetUserId);

        return this.success(result);
    };

    followers = async () => {
        const userId = this.requireParam('userId');
        const options = this.getQueryFilters();

        const result = await FollowService.getFollowers(userId, options);
        return this.success(result);
    };

    following = async () => {
        const userId = this.requireParam('userId');
        const options = this.getQueryFilters();

        const result = await FollowService.getFollowing(userId, options);
        return this.success(result);
    };

    followTag = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const tagId = this.requireParam('tagId');
        const result = await FollowService.followTag(user._id, tagId);

        return this.created(result, 'Tag followed');
    };

    unfollowTag = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const tagId = this.requireParam('tagId');
        const result = await FollowService.unfollowTag(user._id, tagId);

        return this.success(result);
    };
}

export default new FollowController();
