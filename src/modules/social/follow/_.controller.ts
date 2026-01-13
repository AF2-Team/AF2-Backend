import { ControllerBase } from '@bases/controller.base.js';
import FollowService from './_.service.js';

class FollowController extends ControllerBase {
    async followUser() {
        const user = this.getUser<{ _id: string }>();
        const targetUserId = this.requireParam('userId');

         if (!user) this.throwValidationError('Unauthorized');

        if (user._id === targetUserId) {
            return this.throwValidationError('You cannot follow yourself');
        }

        const result = await FollowService.followUser(user._id, targetUserId);

        this.created(result, 'User followed');
    };

     async unfollowUser() {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const targetUserId = this.requireParam('userId');
        const result = await FollowService.unfollowUser(user._id, targetUserId);

        this.success(result);
    };

    async getFollowers () {
        const userId = this.requireParam('userId');
        const options = this.getQueryFilters();

        const result = await FollowService.getFollowers(userId, options);
        this.success(result);
    };

     async getFollowings () {
        const userId = this.requireParam('userId');
        const options = this.getQueryFilters();

        const result = await FollowService.getFollowing(userId, options);
        this.success(result);
    };

     async followTag () {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const tagId = this.requireParam('tagId');
        const result = await FollowService.followTag(user._id, tagId);

        this.created(result, 'Tag followed');
    };

    async unfollowTag () {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const tagId = this.requireParam('tagId');
        const result = await FollowService.unfollowTag(user._id, tagId);

        this.success(result);
    };
}

export default new FollowController();
