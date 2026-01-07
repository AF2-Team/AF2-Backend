import { ControllerBase } from '@bases/controller.base.js';
import FavoriteService from './_.service.js';

class FavoriteController extends ControllerBase {
    add = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const postId = this.requireParam('postId');
        const result = await FavoriteService.add(user._id, postId);

        return this.created(result, 'Added to favorites');
    };

    remove = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const postId = this.requireParam('postId');
        const result = await FavoriteService.remove(user._id, postId);

        return this.success(result);
    };

    me = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const options = this.getQueryFilters();
        const result = await FavoriteService.list(user._id, options);

        return this.success(result);
    };
}

export default new FavoriteController();
