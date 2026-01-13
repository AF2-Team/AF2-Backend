import { ControllerBase } from '@bases/controller.base.js';
import FavoriteService from './_.service.js';

class FavoriteController extends ControllerBase {
    async addFavorite() {
        const user = this.getUser<{ _id: string }>();
        const postId = this.requireParam('postId');
        const result = await FavoriteService.addFavorite(user!._id, postId);

        this.created(result, 'Added to favorites');
    }

    async removeFavorite() {
        const user = this.getUser<{ _id: string }>();
        const postId = this.requireParam('postId');
        const result = await FavoriteService.removeFavorite(user!._id, postId);

        this.success(result);
    }

    async getMyFavorites() {
        const user = this.getUser<{ _id: string }>();
        const options = this.getQueryFilters();
        const result = await FavoriteService.getMyFavorites(user!._id, options);

        this.success(result);
    }
}

export default new FavoriteController();
